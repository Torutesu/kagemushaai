use hypr_pyannote_local::embedding::EmbeddingExtractor;

#[derive(Debug, thiserror::Error)]
pub enum DiarizationError {
    #[error("embedding extraction failed: {0}")]
    EmbeddingFailed(#[from] hypr_pyannote_local::Error),
    #[error("empty audio segment")]
    EmptySegment,
}

pub type Result<T> = std::result::Result<T, DiarizationError>;

#[derive(Debug, Clone)]
pub struct SpeakerAssignment {
    pub start_ms: i64,
    pub end_ms: i64,
    pub speaker_index: i32,
}

const COSINE_SIMILARITY_THRESHOLD: f32 = 0.5;

struct SpeakerCluster {
    centroid: Vec<f32>,
    count: usize,
}

pub struct DiarizationSession {
    extractor: EmbeddingExtractor,
    clusters: Vec<SpeakerCluster>,
    assignments: Vec<SpeakerAssignment>,
}

impl DiarizationSession {
    pub fn new() -> Self {
        Self {
            extractor: EmbeddingExtractor::new(),
            clusters: Vec::new(),
            assignments: Vec::new(),
        }
    }

    pub fn process_segment(&mut self, samples: &[f32], start_ms: i64, end_ms: i64) -> Result<i32> {
        if samples.is_empty() {
            return Err(DiarizationError::EmptySegment);
        }

        let embedding = self
            .extractor
            .compute(samples.iter().copied())
            .map_err(DiarizationError::EmbeddingFailed)?;

        let speaker_index = self.assign_to_cluster(&embedding);

        self.assignments.push(SpeakerAssignment {
            start_ms,
            end_ms,
            speaker_index,
        });

        tracing::debug!(
            speaker_index,
            start_ms,
            end_ms,
            num_clusters = self.clusters.len(),
            "assigned segment to speaker"
        );

        Ok(speaker_index)
    }

    pub fn get_assignments(&self) -> Vec<SpeakerAssignment> {
        self.assignments.clone()
    }

    fn assign_to_cluster(&mut self, embedding: &[f32]) -> i32 {
        let mut best_index: Option<usize> = None;
        let mut best_similarity: f32 = f32::NEG_INFINITY;

        for (i, cluster) in self.clusters.iter().enumerate() {
            let similarity = cosine_similarity(embedding, &cluster.centroid);
            if similarity > best_similarity {
                best_similarity = similarity;
                best_index = Some(i);
            }
        }

        if let Some(idx) = best_index {
            if best_similarity >= COSINE_SIMILARITY_THRESHOLD {
                self.update_centroid(idx, embedding);
                return idx as i32;
            }
        }

        let new_index = self.clusters.len();
        self.clusters.push(SpeakerCluster {
            centroid: embedding.to_vec(),
            count: 1,
        });
        new_index as i32
    }

    fn update_centroid(&mut self, cluster_idx: usize, embedding: &[f32]) {
        let cluster = &mut self.clusters[cluster_idx];
        let n = cluster.count as f32;
        for (c, e) in cluster.centroid.iter_mut().zip(embedding.iter()) {
            *c = (*c * n + e) / (n + 1.0);
        }
        cluster.count += 1;
    }
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let mut dot = 0.0f32;
    let mut norm_a = 0.0f32;
    let mut norm_b = 0.0f32;

    for (x, y) in a.iter().zip(b.iter()) {
        dot += x * y;
        norm_a += x * x;
        norm_b += y * y;
    }

    let denom = norm_a.sqrt() * norm_b.sqrt();
    if denom == 0.0 {
        return 0.0;
    }
    dot / denom
}

pub fn assign_speakers_to_words(
    assignments: &[SpeakerAssignment],
    words: &mut [(i64, i64, &mut Option<i32>)],
) {
    for (word_start, word_end, speaker) in words.iter_mut() {
        let mut best_overlap: i64 = 0;
        let mut best_speaker: Option<i32> = None;

        for assignment in assignments {
            let overlap_start = (*word_start).max(assignment.start_ms);
            let overlap_end = (*word_end).min(assignment.end_ms);
            let overlap = (overlap_end - overlap_start).max(0);

            if overlap > best_overlap {
                best_overlap = overlap;
                best_speaker = Some(assignment.speaker_index);
            }
        }

        if let Some(idx) = best_speaker {
            **speaker = Some(idx);
        }
    }
}
