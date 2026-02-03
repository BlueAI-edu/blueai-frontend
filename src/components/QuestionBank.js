import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LaTeXRenderer from './LaTeXRenderer';
import { API } from '@/config';

const QuestionBank = ({ user, questions, onRefresh, onEdit }) => {
  const [filteredQuestions, setFilteredQuestions] = useState(questions);
  const [filters, setFilters] = useState({
    search: '',
    subject: 'all',
    key_stage: 'all',
    exam_board: 'all',
    source: 'all',
    min_quality: 0,
    max_marks_min: 0,
    max_marks_max: 20
  });
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, quality_desc, marks_asc
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    applyFilters();
  }, [questions, filters, sortBy]);

  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(q =>
        q.question_text?.toLowerCase().includes(searchLower) ||
        q.topic?.toLowerCase().includes(searchLower) ||
        q.subject?.toLowerCase().includes(searchLower) ||
        q.keywords?.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    // Subject filter
    if (filters.subject !== 'all') {
      filtered = filtered.filter(q => q.subject === filters.subject);
    }

    // Key Stage filter
    if (filters.key_stage !== 'all') {
      filtered = filtered.filter(q => q.key_stage === filters.key_stage);
    }

    // Exam Board filter
    if (filters.exam_board !== 'all') {
      filtered = filtered.filter(q => q.exam_board === filters.exam_board);
    }

    // Source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(q => q.source === filters.source);
    }

    // Quality filter
    if (filters.min_quality > 0) {
      filtered = filtered.filter(q => (q.quality_score || 0) >= filters.min_quality);
    }

    // Marks range filter
    filtered = filtered.filter(q =>
      q.max_marks >= filters.max_marks_min && q.max_marks <= filters.max_marks_max
    );

    // Sorting
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        break;
      case 'quality_desc':
        filtered.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
        break;
      case 'marks_asc':
        filtered.sort((a, b) => a.max_marks - b.max_marks);
        break;
      default:
        break;
    }

    setFilteredQuestions(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      subject: 'all',
      key_stage: 'all',
      exam_board: 'all',
      source: 'all',
      min_quality: 0,
      max_marks_min: 0,
      max_marks_max: 20
    });
  };

  const toggleQuestionSelection = (id) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
  };

  const deselectAll = () => {
    setSelectedQuestions(new Set());
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedQuestions.size} selected questions?`)) return;

    try {
      for (const id of selectedQuestions) {
        await axios.delete(`${API}/teacher/questions/${id}`);
      }
      setSelectedQuestions(new Set());
      onRefresh();
    } catch (error) {
      alert('Failed to delete some questions');
    }
  };

  const handleClone = async (question) => {
    try {
      const clonedQuestion = {
        ...question,
        subject: question.subject,
        exam_type: question.exam_type,
        topic: question.topic + ' (Copy)',
        question_text: question.question_text,
        max_marks: question.max_marks,
        mark_scheme: question.mark_scheme,
        source: question.source,
        key_stage: question.key_stage,
        exam_board: question.exam_board,
        tier: question.tier,
        question_title: question.question_title ? question.question_title + ' (Copy)' : null,
        topic_tags: question.topic_tags,
        mark_scheme_json: question.mark_scheme_json,
        model_answer: question.model_answer,
        common_mistakes: question.common_mistakes,
        keywords: question.keywords,
        diagram_prompt: question.diagram_prompt,
        quality_score: question.quality_score,
        quality_notes: question.quality_notes,
        calculator_allowed: question.calculator_allowed
      };

      await axios.post(`${API}/teacher/questions`, clonedQuestion);
      onRefresh();
    } catch (error) {
      alert('Failed to clone question');
    }
  };

  // Extract unique values for filters
  const uniqueSubjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
  const uniqueKeyStages = [...new Set(questions.map(q => q.key_stage).filter(Boolean))];
  const uniqueExamBoards = [...new Set(questions.map(q => q.exam_board).filter(Boolean))];

  return (
    <div>
      {/* Header with Stats */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Your Question Bank</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              {viewMode === 'grid' ? '📋 List' : '🔲 Grid'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">Total Questions</p>
            <p className="text-2xl font-bold text-blue-900">{questions.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-600 font-medium">AI Generated</p>
            <p className="text-2xl font-bold text-purple-900">
              {questions.filter(q => q.source === 'ai_generated').length}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 font-medium">High Quality (85+)</p>
            <p className="text-2xl font-bold text-green-900">
              {questions.filter(q => (q.quality_score || 0) >= 85).length}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 font-medium">With Diagrams</p>
            <p className="text-2xl font-bold text-yellow-900">
              {questions.filter(q => q.diagram_prompt).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-900">Filters & Search</h4>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search questions, topics, keywords..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Key Stage */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Key Stage</label>
            <select
              value={filters.key_stage}
              onChange={(e) => handleFilterChange('key_stage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Key Stages</option>
              {uniqueKeyStages.map(ks => <option key={ks} value={ks}>{ks}</option>)}
            </select>
          </div>

          {/* Exam Board */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Exam Board</label>
            <select
              value={filters.exam_board}
              onChange={(e) => handleFilterChange('exam_board', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Boards</option>
              {uniqueExamBoards.map(eb => <option key={eb} value={eb}>{eb}</option>)}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="ai_generated">AI Generated</option>
            </select>
          </div>

          {/* Quality Score */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Quality Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.min_quality}
              onChange={(e) => handleFilterChange('min_quality', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="quality_desc">Highest Quality</option>
              <option value="marks_asc">Marks (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedQuestions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={deselectAll}
                className="px-3 py-1 bg-white border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-50"
              >
                Deselect All
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Display */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-600 mb-4">No questions match your filters</p>
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Select All ({filteredQuestions.length})
            </button>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
            {filteredQuestions.map((q) => (
              <div key={q.id} className="bg-white p-6 rounded-lg shadow" data-testid={`question-${q.id}`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(q.id)}
                    onChange={() => toggleQuestionSelection(q.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{q.subject} - {q.exam_type}</h3>
                      {q.source === 'ai_generated' && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">🤖 AI</span>
                      )}
                      {q.quality_score && q.quality_score >= 85 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">⭐ {q.quality_score}</span>
                      )}
                      {q.diagram_prompt && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📐 Diagram</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{q.topic}</p>
                    <div className="text-gray-700 mb-2 line-clamp-3">
                      <LaTeXRenderer text={q.question_text} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Max Marks: {q.max_marks}</span>
                      {q.key_stage && <span>• {q.key_stage}</span>}
                      {q.exam_board && <span>• {q.exam_board}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onEdit(q)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                      data-testid={`edit-question-${q.id}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleClone(q)}
                      className="text-green-600 hover:text-green-700 text-sm"
                      data-testid={`clone-question-${q.id}`}
                    >
                      Clone
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionBank;
