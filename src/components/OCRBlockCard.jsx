import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConfidenceBadge from './ConfidenceBadge';
import { cn } from '@/lib/utils';

export default function OCRBlockCard({ 
  block, 
  blockIndex, 
  onSave, 
  onCleanUp, 
  disabled = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(block.text);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(blockIndex, editedText);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save block:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedText(block.text);
    setIsEditing(false);
  };

  const getBlockTypeLabel = () => {
    const types = {
      heading: 'Question/Title',
      answer: 'Answer',
      working: 'Working/Steps',
      diagram: 'Diagram/Graph',
      diagram_label: 'Diagram Label',
      table: 'Table',
      default: 'Text'
    };
    return types[block.block_type] || types.default;
  };

  const needsCleanup = block.confidence < 0.80;
  const isLowConfidence = block.confidence < 0.65;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      isLowConfidence && "border-red-200 bg-red-50/30",
      needsCleanup && !isLowConfidence && "border-amber-200 bg-amber-50/30"
    )}>
      {/* Block Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-medium">
              Block {blockIndex + 1}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getBlockTypeLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge 
              confidence={block.confidence} 
              size="small"
              showLabel={true}
            />
            {isLowConfidence && (
              <Badge variant="destructive" className="text-xs">
                Needs Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Block Content */}
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[120px] p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Edit text..."
              disabled={disabled || isSaving}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={disabled || isSaving}
                size="sm"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button 
                onClick={handleCancel}
                disabled={disabled || isSaving}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="min-h-[100px] p-3 bg-muted/30 border rounded-lg font-mono text-sm whitespace-pre-wrap">
              {block.text || <span className="text-muted-foreground italic">No text extracted</span>}
            </div>
            
            {/* AI Cleaned Indicator */}
            {block.cleaned_text && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md">
                <div className="text-xs font-medium text-emerald-800 mb-1 flex items-center gap-1">
                  <span>✓</span>
                  AI Cleaned
                </div>
                <div className="text-xs text-muted-foreground">
                  Original: <span className="line-through">{block.original_text}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      {!isEditing && (
        <CardFooter className="pt-2 gap-2">
          <Button
            onClick={() => setIsEditing(true)}
            disabled={disabled}
            variant="outline"
            size="sm"
          >
            Edit
          </Button>
          
          {(needsCleanup || isLowConfidence) && onCleanUp && (
            <Button
              onClick={() => onCleanUp(blockIndex)}
              disabled={disabled}
              variant="secondary"
              size="sm"
            >
              ✨ AI Clean Up
            </Button>
          )}
        </CardFooter>
      )}

      {/* Low Confidence Warning */}
      {isLowConfidence && !isEditing && (
        <div className="px-6 py-2 bg-red-100/50 border-t border-red-200">
          <p className="text-xs text-red-700">
            <strong>Low Confidence:</strong> This block may contain errors. 
            Use "AI Clean Up" or manually edit to correct.
          </p>
        </div>
      )}
    </Card>
  );
}
