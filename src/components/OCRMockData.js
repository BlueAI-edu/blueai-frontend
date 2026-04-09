export const mockOCRSubmissionWithBlocks = {
  submission: {
    submission_id: 123,
    assessment_id: 456,
    student_name: "John Smith",
    batch_label: "Class 10A",
    status: "reviewed",
    total_score: null,
    www: null,
    next_steps: null,
    overall_feedback: null,
    created_at: "2026-04-07T10:30:00Z"
  },
  pages: [
    {
      page_number: 1,
      file_path: "/uploads/ocr/123/page1.png",
      page_type: "question",
      vision_confidence: 0.88,
      is_approved: false,
      approved_ocr_text: null,
      vision_responses: [
        {
          question_ref: "1",
          question_number: 1,
          part_label: null,
          answer_text: "x = 42",
          working_text: "2x + 5 = 89\n2x = 84\nx = 42",
          confidence: 0.92
        }
      ]
    },
    {
      page_number: 2,
      file_path: "/uploads/ocr/123/page2.png",
      page_type: "question",
      vision_confidence: 0.82,
      is_approved: false,
      approved_ocr_text: null,
      vision_responses: [
        {
          question_ref: "2",
          question_number: 2,
          part_label: null,
          answer_text: "Area = length x width",
          working_text: "",
          confidence: 0.88
        },
        {
          question_ref: "3a",
          question_number: 3,
          part_label: "a",
          answer_text: "The answr is 56",
          working_text: "Work1ng:\nFirst I add 23 and 33\nThen I multiply by 1",
          confidence: 0.65
        }
      ]
    }
  ],
  response_blocks: [
    {
      block_id: "rb_Q1",
      question_ref: "1",
      question_number: 1,
      part_label: null,
      extracted_text: "x = 42\n\n2x + 5 = 89\n2x = 84\nx = 42",
      source_pages: [1],
      source_block_ids: [],
      is_continuation: false,
      ocr_confidence: 0.92,
      segmentation_confidence: 0.90,
      contamination_flag: false,
      review_required: false,
      cleaned_text: null
    },
    {
      block_id: "rb_Q2",
      question_ref: "2",
      question_number: 2,
      part_label: null,
      extracted_text: "Area = length x width",
      source_pages: [1],
      source_block_ids: [],
      is_continuation: false,
      ocr_confidence: 0.88,
      segmentation_confidence: 0.90,
      contamination_flag: false,
      review_required: false,
      cleaned_text: null
    },
    {
      block_id: "rb_Q3a",
      question_ref: "3a",
      question_number: 3,
      part_label: "a",
      extracted_text: "The answr is 56\n\nWork1ng:\nFirst I add 23 and 33\nThen I multiply by 1",
      source_pages: [2],
      source_block_ids: [],
      is_continuation: false,
      ocr_confidence: 0.65,
      segmentation_confidence: 0.90,
      contamination_flag: false,
      review_required: true,
      cleaned_text: null
    }
  ]
};

export const mockAICleanupResponse = {
  block_id: "rb_Q3a",
  original_text: "The answr is 56",
  cleaned_text: "The answer is 56",
  confidence_before: 0.65,
  confidence_after: 0.95,
  certainty: 0.98,
  changes: [
    {
      type: "character",
      from: "answr",
      to: "answer",
      certainty: 0.98,
      reason: "Character misrecognition - 'answr' → 'answer'"
    }
  ],
  rules_applied: [
    {
      rule: "preserve_numbers",
      status: "passed",
      reason: "Number '56' unchanged (100% certain match)"
    },
    {
      rule: "preserve_student_grammar",
      status: "passed",
      reason: "No grammar modifications - only character fix"
    },
    {
      rule: "no_invented_claims",
      status: "passed",
      reason: "No new content added"
    }
  ]
};

export const mockAICleanupResponseWithFailures = {
  block_id: "rb_Q3a",
  original_text: "The answr is 56",
  cleaned_text: "The answer is 56. Therefore x = 56",
  confidence_before: 0.65,
  confidence_after: 0.88,
  certainty: 0.85,
  changes: [
    {
      type: "character",
      from: "answr",
      to: "answer",
      certainty: 0.95,
      reason: "Character misrecognition"
    },
    {
      type: "addition",
      from: "",
      to: ". Therefore x = 56",
      certainty: 0.85,
      reason: "Added context"
    }
  ],
  rules_applied: [
    {
      rule: "preserve_numbers",
      status: "passed",
      reason: "Number '56' unchanged"
    },
    {
      rule: "preserve_student_grammar",
      status: "passed",
      reason: "Grammar fix only"
    },
    {
      rule: "no_invented_claims",
      status: "failed",
      reason: "Cannot add 'Therefore x = 56' - this is a new claim not present in original"
    }
  ]
};
