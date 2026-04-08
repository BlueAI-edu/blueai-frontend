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
      average_confidence: 0.82,
      min_confidence: 0.65,
      is_approved: false,
      approved_ocr_text: null,
      blocks: [
        {
          block_id: "p1b1",
          text: "Question 1: Solve for x",
          confidence: 0.95,
          block_type: "heading",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p1b2",
          text: "x =42",
          confidence: 0.68,
          block_type: "answer",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p1b3",
          text: "Working:\n2x + 5 = 89\n2x = 84\nx = 42",
          confidence: 0.73,
          block_type: "working",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p1b4",
          text: "Question 2: Calculate the area",
          confidence: 0.92,
          block_type: "heading",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p1b5",
          text: "Area = length x width",
          confidence: 0.88,
          block_type: "answer",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        }
      ]
    },
    {
      page_number: 2,
      file_path: "/uploads/ocr/123/page2.png",
      average_confidence: 0.79,
      min_confidence: 0.58,
      is_approved: false,
      approved_ocr_text: null,
      blocks: [
        {
          block_id: "p2b1",
          text: "Question 3: Evaluate the expression",
          confidence: 0.90,
          block_type: "heading",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p2b2",
          text: "The answr is 56",
          confidence: 0.72,
          block_type: "answer",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        },
        {
          block_id: "p2b3",
          text: "Work1ng:\nFirst I add 23 and 33\nThen I multiply by 1",
          confidence: 0.58,
          block_type: "working",
          cleaned_text: null,
          original_text: null,
          is_cleaned: false
        }
      ]
    }
  ]
};

export const mockOCRSubmissionLegacy = {
  submission: {
    submission_id: 124,
    assessment_id: 456,
    student_name: "Jane Doe",
    batch_label: null,
    status: "reviewed",
    total_score: null,
    www: null,
    next_steps: null,
    overall_feedback: null,
    created_at: "2026-04-07T11:00:00Z"
  },
  pages: [
    {
      page_number: 1,
      file_path: "/uploads/ocr/124/page1.png",
      confidence: 0.78,
      is_approved: false,
      approved_ocr_text: null,
      ocr_text: "Question 1: Solve for x\n\nx = 42\n\nWorking:\n2x + 5 = 89\n2x = 84\nx = 42"
    }
  ]
};

export const mockAICleanupResponse = {
  block_id: "p1b2",
  original_text: "x =42",
  cleaned_text: "x = 42",
  confidence_before: 0.68,
  confidence_after: 0.95,
  certainty: 0.98,
  changes: [
    {
      type: "spacing",
      from: "=42",
      to: "= 42",
      certainty: 0.98,
      reason: "Common OCR error - missing space after equals sign"
    }
  ],
  rules_applied: [
    {
      rule: "preserve_numbers",
      status: "passed",
      reason: "Number '42' unchanged (100% certain match)"
    },
    {
      rule: "preserve_student_grammar",
      status: "passed",
      reason: "No grammar modifications - only spacing fix"
    },
    {
      rule: "no_invented_claims",
      status: "passed",
      reason: "No new content added"
    }
  ]
};

export const mockAICleanupResponseWithFailures = {
  block_id: "p2b2",
  original_text: "The answr is 56",
  cleaned_text: "The answer is 56. Therefore x = 56",
  confidence_before: 0.72,
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