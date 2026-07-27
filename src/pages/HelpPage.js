import { useState, useMemo } from 'react';
import { Search, HelpCircle, Play } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_SECTIONS = [
  // MARKING
  {
    id: 'view-mark-submissions',
    title: 'How to view and mark student submissions?',
    description: 'Learn how to access student work and provide marks and feedback.',
    category: 'Marking',
    popular: true,
    content: (
      <div className="space-y-4 text-gray-700">
        <ol className="space-y-3 list-decimal list-inside">
          <li><strong>Go to Assessments</strong> – Click the Assessments tab in the main navigation</li>
          <li><strong>Select an assessment</strong> – Choose the assignment you want to mark</li>
          <li><strong>View submissions</strong> – You'll see a list of all student submissions with their status (submitted, pending, etc.)</li>
          <li><strong>Click a student's submission</strong> – This opens the submission detail view</li>
          <li><strong>Add marks</strong> – Enter marks for each question. Auto-marked questions show the AI score; manual questions allow your input</li>
          <li><strong>Write feedback</strong> – Use the feedback box to provide comments, corrections, or encouragement</li>
          <li><strong>Save & submit</strong> – Click "Save" to save your marks. The student receives your feedback immediately</li>
        </ol>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> Use the filter options to see "Pending Review" submissions first to prioritize your marking workflow.</p>
        {/* Video Placeholder */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Video walkthrough</h4>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-70"></div>
            <button className="relative flex flex-col items-center gap-3 hover:scale-110 transition-transform">
              <div className="p-3 bg-blue-600 rounded-full">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium">How to mark submissions</span>
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'ai-marking-override',
    title: 'How does the AI marking work / when should I override it?',
    description: 'Understand AI-generated marks and when to manually override them.',
    category: 'Marking',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>How AI marking works:</strong> BlueAI automatically marks certain question types (multiple choice, short numeric answers, true/false) using pattern matching and rule-based logic. The AI score is calculated instantly when the student submits.</p>
        <p><strong>When to override:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>Correct but different phrasing:</strong> Student's answer is right but worded differently than the model answer</li>
          <li><strong>Partial credit for method:</strong> Working is correct but final answer is wrong due to arithmetic slip</li>
          <li><strong>Ambiguous questions:</strong> Question could reasonably be interpreted multiple ways</li>
          <li><strong>Special circumstances:</strong> Health, learning support, or other student-specific factors</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> Mark submissions with AI scores as "Needs Review" to flag them for your attention. You can batch-review similar cases together.</p>
      </div>
    ),
  },
  {
    id: 'detailed-feedback',
    title: 'How do I provide detailed feedback to students?',
    description: 'Add comments, annotations, and constructive feedback to guide improvement.',
    category: 'Marking',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Feedback best practices:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>Be specific:</strong> "Good work on question 2—your explanation of the method was clear" instead of "Good work"</li>
          <li><strong>Identify improvements:</strong> "Question 5: Check your units—the calculation is right, but your answer needs a unit label"</li>
          <li><strong>Highlight strengths:</strong> Point out what the student did well to build confidence</li>
          <li><strong>Suggest next steps:</strong> "Try using a diagram for question 7 next time—it helps organize your thoughts"</li>
        </ul>
        <p><strong>Adding feedback in BlueAI:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Open a student's submission</li>
          <li>Find the feedback box at the bottom</li>
          <li>Type your feedback or click "Add per-question feedback" to comment on individual answers</li>
          <li>Save—feedback appears to the student immediately</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'auto-vs-manual-marking',
    title: 'What\'s the difference between auto-marking and manual marking?',
    description: 'Learn which questions are auto-marked and when manual review is needed.',
    category: 'Marking',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Auto-marked questions:</strong> Marked automatically by BlueAI when the student submits</p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Multiple choice</li>
          <li>True/False</li>
          <li>Short numeric answers (with configurable tolerance)</li>
          <li>Fill-in-the-blank with exact matches</li>
        </ul>
        <p><strong>Manually-marked questions:</strong> Require teacher review</p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Extended written answers (essays, explanations)</li>
          <li>Short text answers requiring judgment</li>
          <li>Diagram-based answers</li>
          <li>Questions marked as "requires human judgment"</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Note:</strong> You can always override any auto-marked score if needed. Use the marking filter to see which questions are pending your review.</p>
      </div>
    ),
  },
  {
    id: 'marking-statistics',
    title: 'How can I see marking statistics for my class?',
    description: 'View class-level marking progress, time spent, and completion rates.',
    category: 'Marking',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>To view marking statistics:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Analytics</strong> in the navigation</li>
          <li>Select the assessment you want to review</li>
          <li>View the marking summary showing:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li><strong>% Marked:</strong> How many submissions you've completed</li>
          <li><strong>Pending:</strong> Number of submissions still awaiting your marks</li>
          <li><strong>Average mark:</strong> Class mean and median performance</li>
          <li><strong>Grade distribution:</strong> Visual breakdown of A/B/C/D grades</li>
          <li><strong>Time-to-mark:</strong> Average time per submission</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> Use these stats to track your marking progress and identify struggling students who may need extra support.</p>
      </div>
    ),
  },

  // CLASSES
  {
    id: 'setup-class-students',
    title: 'How to set up a class or add students?',
    description: 'Step-by-step guide to creating classes and enrolling students.',
    category: 'Classes',
    popular: true,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Create a new class:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Classes</strong> in the navigation</li>
          <li>Click <strong>"Create Class"</strong></li>
          <li>Enter class name (e.g., "Year 9 Biology Group A")</li>
          <li>Select year group and subject (optional but recommended for organization)</li>
          <li>Click <strong>"Create"</strong></li>
        </ol>
        <p><strong>Add students to a class:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Click on the class name</li>
          <li>Click <strong>"Add Students"</strong></li>
          <li>Choose one of three options:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li><strong>Add individually:</strong> Search and select students one by one</li>
          <li><strong>Bulk import:</strong> Upload a CSV file with student names/IDs</li>
          <li><strong>Share join code:</strong> Students enter a code to join themselves</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'bulk-import-students',
    title: 'How do I bulk import students into a class?',
    description: 'Upload student lists via CSV or connect to your school system.',
    category: 'Classes',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>File format (CSV):</strong> Your spreadsheet should have at least:</p>
        <ul className="space-y-2 list-disc list-inside">
          <li>First Name</li>
          <li>Last Name</li>
          <li>Email (optional but recommended for password resets)</li>
        </ul>
        <p><strong>Steps:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Classes → [Class Name]</strong></li>
          <li>Click <strong>"Add Students" → "Bulk Import"</strong></li>
          <li>Download the template CSV or upload your own file</li>
          <li>Review the preview to ensure names are correct</li>
          <li>Click <strong>"Import"</strong> to add all students</li>
        </ol>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> You can re-import the same file multiple times—it will only add new students and skip duplicates.</p>
      </div>
    ),
  },
  {
    id: 'remove-student',
    title: 'How do I remove a student from a class?',
    description: 'Manage class membership and student access.',
    category: 'Classes',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>To remove a student:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Classes → [Class Name]</strong></li>
          <li>Find the student in the class roster</li>
          <li>Click the three-dot menu (<strong>⋯</strong>) next to their name</li>
          <li>Select <strong>"Remove from class"</strong></li>
          <li>Confirm the removal</li>
        </ol>
        <p className="text-sm bg-blue-50 p-3 rounded">⚠️ <strong>Important:</strong> Removing a student does NOT delete their previous submissions or marks. Those are preserved for records. The student simply loses access to create new submissions.</p>
      </div>
    ),
  },
  {
    id: 'class-marking-rules',
    title: 'Can I set different marking rules for different classes?',
    description: 'Configure class-specific marking thresholds and requirements.',
    category: 'Classes',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p>Yes! You can customize marking behavior per class:</p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Classes → [Class Name] → Settings</strong></li>
          <li>Find <strong>"Marking Rules"</strong></li>
          <li>Configure:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li><strong>Auto-review threshold:</strong> Mark answers as "Needs Review" if AI confidence is below X%</li>
          <li><strong>Numeric tolerance:</strong> Accept answers within ±X of the correct value</li>
          <li><strong>Require written feedback:</strong> Force teachers to add comments on all submissions</li>
          <li><strong>Grade cutoffs:</strong> Define custom A/B/C grade boundaries for this class</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Example:</strong> Year 9 might have a 5% numeric tolerance, while Year 11 GCSE prep might require ±1.</p>
      </div>
    ),
  },

  // ASSESSMENTS
  {
    id: 'generate-questions',
    title: 'How to generate questions?',
    description: 'Create and customize assessment questions using BlueAI.',
    category: 'Assessments',
    popular: true,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Create an assessment:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Assessments → Create New</strong></li>
          <li>Name your assessment and select subject/year group</li>
          <li>Click <strong>"Add Questions"</strong></li>
        </ol>
        <p><strong>Three ways to add questions:</strong></p>
        <ul className="space-y-3 list-disc list-inside">
          <li><strong>Generate with AI:</strong> Describe what you want ("5 questions on photosynthesis, mixed difficulty") and BlueAI creates them</li>
          <li><strong>From Question Bank:</strong> Browse existing questions your school has used before</li>
          <li><strong>Write manually:</strong> Type your own question and mark scheme</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> Always review AI-generated questions—edit the mark scheme and model answers to match your exact expectations before releasing to students.</p>
        {/* Video Placeholder */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Video walkthrough</h4>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-70"></div>
            <button className="relative flex flex-col items-center gap-3 hover:scale-110 transition-transform">
              <div className="p-3 bg-blue-600 rounded-full">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium">AI question generation</span>
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'upload-existing-assessments',
    title: 'Can I upload existing assessments or question papers?',
    description: 'Import PDFs, Word docs, or existing question banks.',
    category: 'Assessments',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p>Yes! You can upload past papers or existing question sets:</p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Assessments → Create New</strong></li>
          <li>Click <strong>"Upload Document"</strong></li>
          <li>Choose a PDF or Word doc (scanned papers are OCR'd automatically)</li>
          <li>BlueAI extracts questions and offers to:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li>Add extracted text to individual questions</li>
          <li>Generate mark schemes if missing</li>
          <li>Organize into sections</li>
        </ul>
        <p><strong>After upload:</strong> Review, edit, and add mark schemes before releasing to students. You can store it for future reuse or modify for this cohort.</p>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Note:</strong> Handwritten papers may not OCR perfectly—proofread carefully.</p>
        {/* Video Placeholder */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Video walkthrough</h4>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-70"></div>
            <button className="relative flex flex-col items-center gap-3 hover:scale-110 transition-transform">
              <div className="p-3 bg-blue-600 rounded-full">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium">Understanding the dashboard</span>
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'assessment-scheduling',
    title: 'How do I set up assessment scheduling?',
    description: 'Schedule release dates, deadlines, and marking windows.',
    category: 'Assessments',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Set assessment dates:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Assessments → [Assessment Name] → Settings</strong></li>
          <li>Find <strong>"Scheduling"</strong></li>
          <li>Set the following dates:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li><strong>Release date:</strong> When students can first access the assessment</li>
          <li><strong>Due date:</strong> When students must submit (they can't submit after this)</li>
          <li><strong>Marking deadline:</strong> Reminder for you to complete all marks</li>
        </ul>
        <p><strong>You can also:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Set different deadlines for different classes (useful for staggered timetables)</li>
          <li>Allow late submissions with a penalty flag</li>
          <li>Hide answers from students until marks are released</li>
        </ul>
        {/* Video Placeholder */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Video walkthrough</h4>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-70"></div>
            <button className="relative flex flex-col items-center gap-3 hover:scale-110 transition-transform">
              <div className="p-3 bg-blue-600 rounded-full">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium">Understanding the dashboard</span>
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'duplicate-reuse-assessments',
    title: 'How can I duplicate or reuse past assessments?',
    description: 'Save time by copying and adapting previous assessments.',
    category: 'Assessments',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Duplicate an assessment:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Assessments</strong> and find a past assessment</li>
          <li>Click the three-dot menu (<strong>⋯</strong>)</li>
          <li>Select <strong>"Duplicate"</strong></li>
          <li>A copy is created with "[Copy]" in the title—edit as needed</li>
          <li>Adjust due dates, deadlines, and target class</li>
          <li>Release to students</li>
        </ol>
        <p><strong>Tips for reuse:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Keep a folder of "favourite assessments" for quick access</li>
          <li>Make minor tweaks (update dates, change 2–3 numbers) to keep assessments fresh</li>
          <li>All duplicates maintain the original mark scheme unless you edit it</li>
        </ul>
      </div>
    ),
  },

  // ANALYTICS
  {
    id: 'interpret-dashboard',
    title: 'How to interpret the dashboard/reports?',
    description: 'Understanding analytics, trends, and student performance data.',
    category: 'Analytics',
    popular: true,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Main dashboard sections:</strong></p>
        <ul className="space-y-3 list-disc list-inside">
          <li><strong>Class Overview:</strong> Average marks, completion rates, and key trends at a glance</li>
          <li><strong>Student Performance:</strong> Individual student grades, progress over time, and at-risk students (highlighted in red)</li>
          <li><strong>Question Analysis:</strong> Which questions your class found difficult; average difficulty vs. your expectations</li>
          <li><strong>Common Mistakes:</strong> Frequent wrong answers on multiple-choice or short-answer questions</li>
        </ul>
        <p><strong>What the colours mean:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>🟢 <strong>Green:</strong> Above class average, strong performance</li>
          <li>🟡 <strong>Yellow:</strong> At class average, mixed performance</li>
          <li>🔴 <strong>Red:</strong> Below average, may need intervention</li>
        </ul>
        {/* Video Placeholder */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Video walkthrough</h4>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-70"></div>
            <button className="relative flex flex-col items-center gap-3 hover:scale-110 transition-transform">
              <div className="p-3 bg-blue-600 rounded-full">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-white text-sm font-medium">Understanding the dashboard</span>
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'export-performance-data',
    title: 'How do I export student performance data?',
    description: 'Generate reports and download data for external systems.',
    category: 'Analytics',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Export data:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Analytics</strong> and select the assessment or class</li>
          <li>Click <strong>"Export"</strong> (usually top-right button)</li>
          <li>Choose your format:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li><strong>CSV:</strong> For Excel, Google Sheets, or your school system</li>
          <li><strong>PDF Report:</strong> Formatted summary for parents or SLT</li>
          <li><strong>JSON:</strong> For technical integrations</li>
        </ul>
        <p><strong>Exported data includes:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Student names and IDs</li>
          <li>Total marks and percentage grades</li>
          <li>Per-question breakdown (optional)</li>
          <li>Timestamp and submission date</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'compare-performance-classes',
    title: 'Can I compare performance across classes?',
    description: 'Benchmark classes and identify areas for support.',
    category: 'Analytics',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p>Yes! Use the <strong>Class Comparison</strong> tool:</p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Analytics → Comparison</strong></li>
          <li>Select 2–3 classes to compare</li>
          <li>Choose an assessment (all selected classes must have taken it)</li>
          <li>View side-by-side comparisons showing:</li>
        </ol>
        <ul className="space-y-2 list-disc list-inside ml-4">
          <li>Average marks and grade distribution</li>
          <li>Question-by-question performance (which class struggled where)</li>
          <li>Statistical significance (is the difference real or random?)</li>
        </ul>
        <p><strong>Use cases:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Compare teaching effectiveness across parallel classes</li>
          <li>Identify topics needing more support in weaker cohorts</li>
          <li>Celebrate improvements term-on-term</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'progress-indicators',
    title: 'What do the progress indicators mean?',
    description: 'Understand color codes, icons, and status symbols.',
    category: 'Analytics',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Status icons you'll see:</strong></p>
        <ul className="space-y-2">
          <li>✅ <strong>Submitted & Marked:</strong> Assessment complete, marks released</li>
          <li>⏳ <strong>Submitted & Pending:</strong> Student submitted, you haven't marked yet</li>
          <li>📝 <strong>Draft (unsaved):</strong> Student is still working, hasn't submitted</li>
          <li>❌ <strong>Not Started:</strong> Student hasn't opened the assessment</li>
          <li>⚠️ <strong>Needs Review:</strong> AI marked it but flagged for human review (low confidence)</li>
        </ul>
        <p><strong>Performance colour bands:</strong></p>
        <ul className="space-y-2">
          <li>🟢 A/B grade (80%+): Strong performance</li>
          <li>🟡 C/D grade (60–79%): Solid, on track</li>
          <li>🔴 E or below (&lt;60%): Below target, needs support</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Tip:</strong> Use the "Needs Review" filter to quickly find submissions requiring your judgment calls.</p>
      </div>
    ),
  },

  // TROUBLESHOOTING
  {
    id: 'troubleshooting',
    title: 'Why is a submission stuck in review?',
    description: 'Diagnose and resolve submissions that won\'t progress.',
    category: 'Troubleshooting',
    popular: true,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Stuck in review means:</strong> The submission was received, but the system hasn't been able to process it fully (usually auto-marking failed).</p>
        <p><strong>Common causes & fixes:</strong></p>
        <ol className="space-y-3 list-decimal list-inside">
          <li><strong>AI processing delay:</strong> Wait 5–10 mins. Longer essays take time to process. Refresh the page.</li>
          <li><strong>Network error during submission:</strong> Student lost connection after hitting "submit." Ask them to reopen the assessment—it should show as submitted.</li>
          <li><strong>Mark scheme error:</strong> The question's mark scheme is invalid or incomplete. Go to the assessment settings and fix the mark scheme, then re-process the submission.</li>
          <li><strong>Unusual file format:</strong> If the submission includes an attachment or image, it may need manual processing. You'll see a flag—click "Review Manually" to mark it.</li>
        </ol>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>If it's still stuck after 15 mins:</strong> Contact support and share the submission ID (visible at the top of the submission page).</p>
      </div>
    ),
  },
  {
    id: 'marks-not-syncing',
    title: 'Why aren\'t my marks syncing to the gradebook?',
    description: 'Troubleshoot synchronization issues with your school system.',
    category: 'Troubleshooting',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>BlueAI can sync marks to:</strong> Google Classroom, ClassCharts, school SIS, or via CSV download.</p>
        <p><strong>Troubleshooting steps:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Settings → Integrations</strong></li>
          <li>Check that your gradebook system is connected (look for a green checkmark)</li>
          <li>If not connected, click <strong>"Reconnect"</strong> and re-authenticate</li>
          <li>Go to <strong>Analytics → [Assessment]</strong> and click <strong>"Sync Now"</strong></li>
          <li>Wait 2–5 mins for the sync to complete</li>
        </ol>
        <p><strong>If sync still fails:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Check that all students in the assessment are registered in your gradebook system</li>
          <li>Ensure you have permission to edit grades in the external system</li>
          <li>Download as CSV and manually upload to your system as a workaround</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'student-submission-issues',
    title: 'What should I do if a student can\'t submit their work?',
    description: 'Fix submission errors, access issues, and technical problems.',
    category: 'Troubleshooting',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Common problems & solutions:</strong></p>
        <ol className="space-y-3 list-decimal list-inside">
          <li><strong>"Access Denied" error:</strong> Student isn't in the class. Add them via Classes or check they're enrolled.</li>
          <li><strong>"Deadline passed":</strong> Assessment deadline has closed. You can manually extend it in Assessment Settings.</li>
          <li><strong>Submit button won't click:</strong> Student may have missing required fields (unanswered questions). Check the progress bar—incomplete sections are highlighted.</li>
          <li><strong>Browser/device issue:</strong> Ask student to try a different browser (Chrome, Firefox, Safari). Clear cache if they're stuck on an old version.</li>
          <li><strong>File upload failing:</strong> File is too large or in unsupported format. Students can only upload images, PDFs, and documents under 10MB.</li>
        </ol>
        <p className="text-sm bg-blue-50 p-3 rounded">💡 <strong>Quick fix:</strong> Ask the student to submit from a desktop/laptop if they're using mobile—mobile browsers sometimes have submission issues.</p>
      </div>
    ),
  },
  {
    id: 'recover-deleted-assessment',
    title: 'How do I recover a deleted assessment?',
    description: 'Restore assessments from trash or contact support.',
    category: 'Troubleshooting',
    popular: false,
    content: (
      <div className="space-y-4 text-gray-700">
        <p><strong>Deleted assessments go to Trash:</strong></p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Go to <strong>Assessments → Trash</strong> (folder icon at the top)</li>
          <li>Find the deleted assessment</li>
          <li>Click <strong>"Restore"</strong> to bring it back</li>
        </ol>
        <p><strong>Important:</strong></p>
        <ul className="space-y-2 list-disc list-inside">
          <li>Trash is kept for <strong>30 days</strong> before permanent deletion</li>
          <li>Restoring an assessment does NOT restore student submissions—those are preserved separately</li>
          <li>If 30 days have passed, the assessment is permanently deleted and cannot be recovered</li>
        </ul>
        <p className="text-sm bg-blue-50 p-3 rounded">⚠️ <strong>If you can't find it in Trash:</strong> Contact support with the assessment name and original creation date. They may be able to recover it from backups (but this is not guaranteed).</p>
      </div>
    ),
  },
];

// Extract unique categories
const CATEGORIES = ['All FAQs', ...new Set(FAQ_SECTIONS.map((s) => s.category))];

export const HelpPage = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All FAQs');
  const navigate = useNavigate();

  // Filter sections based on search query AND category
  const filteredSections = useMemo(() => {
    let sections = FAQ_SECTIONS;

    // Filter by category
    if (activeCategory === 'All FAQs') {
      // Show only popular FAQs in "All FAQs" view
      sections = sections.filter((s) => s.popular);
    } else {
      sections = sections.filter((s) => s.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sections = sections.filter(
        (section) =>
          section.title.toLowerCase().includes(query) ||
          section.description.toLowerCase().includes(query)
      );
    }

    return sections;
  }, [searchQuery, activeCategory]);

  return (
    <>
      <Navbar user={user} />
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* Decorative elements */}
        <div className="hidden lg:block absolute left-8 top-32 opacity-10">
          <HelpCircle className="w-24 h-24 text-blue-600" />
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <HelpCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Help & Support</h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions and learn how to get the most out of BlueAI.
            </p>
          </div>

          {/* Main Layout: Left Nav + Right Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Category Navigation */}
            <div className="lg:col-span-3">
              {/* Categories Section */}
              <div className="sticky top-24">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 mb-2">
                  Categories
                </p>
                <div className="space-y-2 mb-8">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                        activeCategory === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - FAQ Accordion */}
            <div className="lg:col-span-9">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 shadow-sm transition-all"
                    data-testid="help-search-input"
                  />
                </div>
              </div>

              {/* No Results Message */}
              {filteredSections.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg">
                    No FAQs found. Try different keywords or select another category.
                  </p>
                </div>
              )}

              {/* Accordion with FAQ Sections */}
              {filteredSections.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredSections.map((section) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="border-b last:border-b-0"
                        data-testid={`faq-section-${section.id}`}
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors text-left group">
                          <div className="flex flex-col gap-1 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {section.title}
                            </h3>
                            <p className="text-sm text-gray-500">{section.description}</p>
                            <span className="text-xs font-medium text-blue-600 mt-1">
                              {section.category}
                            </span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-6 py-4 bg-gray-50">
                          {section.content}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Footer CTA */}
              <div className="text-center text-gray-600 mt-8">
                <p className="text-sm">
                  Can't find what you're looking for?{' '}
                  <a
                    href="mailto:support@blueai.com"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Contact support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};