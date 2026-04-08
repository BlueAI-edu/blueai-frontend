import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ConfidenceBadge from './ConfidenceBadge';
import { cn } from '@/lib/utils';

export default function AICleanupModal({ 
  isOpen, 
  onClose, 
  cleanupData, 
  onApprove, 
  onReject,
  isLoading = false 
}) {
  if (!cleanupData) return null;

  const {
    block_id,
    original_text,
    cleaned_text,
    confidence_before,
    confidence_after,
    changes = [],
    rules_applied = []
  } = cleanupData;

  const renderDiff = () => {
    if (changes.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground italic">
          No changes needed
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {changes.map((change, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Original</div>
                  <div className="font-mono text-sm text-red-600 line-through">
                    {change.from}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Corrected</div>
                  <div className="font-mono text-sm text-emerald-600 font-semibold">
                    {change.to}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Type: {change.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Certainty: {(change.certainty * 100).toFixed(0)}%
                </Badge>
              </div>
              {change.reason && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <strong>Reason:</strong> {change.reason}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRules = () => {
    if (rules_applied.length === 0) return null;

    const ruleLabels = {
      preserve_numbers: 'Numbers Preserved',
      preserve_student_grammar: 'Grammar Preserved',
      no_invented_claims: 'No New Claims',
      preserve_original_intent: 'Original Intent Preserved'
    };

    const hasFailures = rules_applied.some(rule => rule.status === 'failed');

    return (
      <Card className={cn(
        "overflow-hidden",
        hasFailures ? "border-red-200 bg-red-50/50" : "border-emerald-200 bg-emerald-50/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {hasFailures ? (
              <span className="text-red-600 font-semibold">⚠ Rules Validation Issues</span>
            ) : (
              <span className="text-emerald-700 font-semibold">✓ Rules Compliance</span>
            )}
          </div>
          <div className="space-y-2">
            {rules_applied.map((rule, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {rule.status === 'passed' ? (
                    <span className="text-emerald-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  <span className="text-foreground">
                    {ruleLabels[rule.rule] || rule.rule}
                  </span>
                </div>
                <Badge 
                  variant={rule.status === 'passed' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {rule.status === 'passed' ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            ))}
          </div>
          {hasFailures && (
            <div className="mt-3 pt-3 border-t border-red-200 text-xs text-red-700">
              This cleanup suggestion violates one or more preservation rules.
              Approving may not be appropriate.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const hasFailures = rules_applied.some(rule => rule.status === 'failed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">AI Cleanup Suggestion</DialogTitle>
          <DialogDescription>
            Review and approve or reject suggested changes for this text block.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Before</div>
                <ConfidenceBadge confidence={confidence_before} size="large" />
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">After</div>
                <ConfidenceBadge confidence={confidence_after} size="large" />
              </CardContent>
            </Card>
          </div>

          {/* Text Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Original Text</div>
              <Card>
                <CardContent className="p-4">
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                    {original_text}
                  </pre>
                </CardContent>
              </Card>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground mb-2">Cleaned Text</div>
              <Card className="border-emerald-200 bg-emerald-50/30">
                <CardContent className="p-4">
                  <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                    {cleaned_text}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Changes Details */}
          <div>
            <div className="text-sm font-medium text-foreground mb-2">
              Changes ({changes.length})
            </div>
            {renderDiff()}
          </div>

          {/* Rules Applied */}
          {renderRules()}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Block ID: {block_id}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onReject}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={onApprove}
              disabled={isLoading || hasFailures}
            >
              {isLoading ? 'Applying...' : 'Approve Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}