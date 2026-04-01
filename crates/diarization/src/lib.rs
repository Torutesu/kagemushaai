use hypr_pyannote_local::embedding::EmbeddingExtractor;

#[derive(Debug, thiserror::Error)]
pub enum DiarizationError {
    #[error("embedding extraction failed: {0}")]
    EmbeddingFailed(#[from] hypr_pyannote_local::Error),
    #[error("empty audio segment")]
    EmptySegment,
    #[error("embedding dimension mismatch: expected {expected}, got {got}")]
    DimensionMismatch { expected: usize, got: usize },
}

pub type Result<T> = std::result::Result<T, DiarizationError>;

#[derive(Debug, Clone)]
pub struct SpeakerAssignment {
    pub start_ms: i64,
    pub end_ms: i64,
    pub speaker_index: i32,
}

const COSINE_SIMILARITY_THRESHOLD: f32 = 0.5;
const MAX_CLUSTERS: usize = 20;

struct SpeakerCluster {
    centroid: Vec<f32>,
    count: usize,
}

pub struct DiarizationSession {
    extractor: EmbeddingExtractor,
    clusters: Vec<SpeakerCluster>,
    assignments: Vec<SpeakerAssignment>,
}

impl Default for DiarizationSession {
    fn default() -> Self {
        Self::new()
    }
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

        let speaker_index = self.assign_to_cluster(&embedding)?;

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

    fn assign_to_cluster(&mut self, embedding: &[f32]) -> Result<i32> {
        if let Some(first) = self.clusters.first() {
            if first.centroid.len() != embedding.len() {
                return Err(DiarizationError::DimensionMismatch {
                    expected: first.centroid.len(),
                    got: embedding.len(),
                });
            }
        }

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
            if best_similarity >= COSINE_SIMILARITY_THRESHOLD
                || self.clusters.len() >= MAX_CLUSTERS
            {
                self.update_centroid(idx, embedding);
                return Ok(idx as i32);
            }
        }

        let new_index = self.clusters.len();
        self.clusters.push(SpeakerCluster {
            centroid: embedding.to_vec(),
            count: 1,
        });
        Ok(new_index as i32)
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

#[cfg(test)]
mod tests {
    use super::*;

    fn make_session_with_clusters(clusters: Vec<Vec<f32>>) -> DiarizationSession {
        let session_clusters = clusters
            .into_iter()
            .map(|centroid| SpeakerCluster { centroid, count: 1 })
            .collect();
        DiarizationSession {
            extractor: EmbeddingExtractor::new(),
            clusters: session_clusters,
            assignments: Vec::new(),
        }
    }

    #[test]
    fn cosine_similarity_identical_vectors() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_orthogonal_vectors() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        assert!(cosine_similarity(&a, &b).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_opposite_vectors() {
        let a = vec![1.0, 0.0];
        let b = vec![-1.0, 0.0];
        assert!((cosine_similarity(&a, &b) + 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_zero_vector() {
        let a = vec![0.0, 0.0];
        let b = vec![1.0, 0.0];
        assert_eq!(cosine_similarity(&a, &b), 0.0);
    }

    #[test]
    fn assign_to_cluster_same_speaker() {
        let centroid = vec![1.0, 0.0, 0.0];
        let mut session = make_session_with_clusters(vec![centroid]);
        let embedding = vec![0.95, 0.1, 0.05];
        let idx = session.assign_to_cluster(&embedding).unwrap();
        assert_eq!(idx, 0);
    }

    #[test]
    fn assign_to_cluster_different_speaker() {
        let centroid = vec![1.0, 0.0, 0.0];
        let mut session = make_session_with_clusters(vec![centroid]);
        let embedding = vec![0.0, 1.0, 0.0];
        let idx = session.assign_to_cluster(&embedding).unwrap();
        assert_eq!(idx, 1);
        assert_eq!(session.clusters.len(), 2);
    }

    #[test]
    fn assign_to_cluster_dimension_mismatch() {
        let centroid = vec![1.0, 0.0, 0.0];
        let mut session = make_session_with_clusters(vec![centroid]);
        let embedding = vec![1.0, 0.0];
        let result = session.assign_to_cluster(&embedding);
        assert!(matches!(
            result,
            Err(DiarizationError::DimensionMismatch {
                expected: 3,
                got: 2
            })
        ));
    }

    #[test]
    fn assign_to_cluster_max_clusters_limit() {
        let clusters: Vec<Vec<f32>> = (0..MAX_CLUSTERS)
            .map(|i| {
                let mut v = vec![0.0f32; MAX_CLUSTERS];
                v[i] = 1.0;
                v
            })
            .collect();
        let mut session = make_session_with_clusters(clusters);
        assert_eq!(session.clusters.len(), MAX_CLUSTERS);

        let mut novel = vec![0.0f32; MAX_CLUSTERS];
        novel[0] = 0.1;
        novel[1] = 0.1;
        let idx = session.assign_to_cluster(&novel).unwrap();
        assert_eq!(session.clusters.len(), MAX_CLUSTERS);
        assert!(idx >= 0 && (idx as usize) < MAX_CLUSTERS);
    }

    #[test]
    fn assign_speakers_to_words_overlap() {
        let assignments = vec![
            SpeakerAssignment {
                start_ms: 0,
                end_ms: 1000,
                speaker_index: 0,
            },
            SpeakerAssignment {
                start_ms: 800,
                end_ms: 2000,
                speaker_index: 1,
            },
        ];

        let mut s1 = None;
        let mut s2 = None;
        let mut s3 = None;
        let mut words = vec![
            (100i64, 500i64, &mut s1),
            (900i64, 1500i64, &mut s2),
            (1600i64, 1900i64, &mut s3),
        ];

        assign_speakers_to_words(&assignments, &mut words);

        assert_eq!(s1, Some(0));
        assert_eq!(s2, Some(1));
        assert_eq!(s3, Some(1));
    }
}
