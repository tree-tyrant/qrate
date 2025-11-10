import { Component, ReactNode, ErrorInfo, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, RotateCcw, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorDetailsProps {
  error?: Error;
  errorInfo?: ErrorInfo;
}

function ErrorDetails({ error, errorInfo }: ErrorDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const errorDetails = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
  };

  const copyToClipboard = async () => {
    const text = JSON.stringify(errorDetails, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Details
            </>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Error
            </>
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Error Message
            </p>
            <p className="text-sm font-mono text-foreground break-words">
              {error.message || 'No error message available'}
            </p>
          </div>
          
          {error.stack && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Stack Trace
              </p>
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto p-2 bg-background rounded border max-h-48 overflow-y-auto">
                {error.stack}
              </pre>
            </div>
          )}
          
          {errorInfo?.componentStack && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Component Stack
              </p>
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto p-2 bg-background rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Store errorInfo for display
    this.setState({ errorInfo });
    
    // Log specific error types for debugging
    if (error.message.includes('CSP')) {
      console.error('Content Security Policy violation detected');
    }
    if (error.message.includes('eval')) {
      console.error('Eval usage blocked by CSP');
    }
    if (error.message.includes('getImageData')) {
      console.error('Canvas operation failed - likely CSP or image issue');
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-lg border-2 border-destructive/20">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-destructive" strokeWidth={2.5} />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Oops! Something went wrong</CardTitle>
                <CardDescription className="text-base">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive mb-1">Error Summary</p>
                  <p className="text-sm text-foreground/80 break-words">
                    {this.state.error.message || 'An unknown error occurred'}
                  </p>
                </div>
              )}
              
              <ErrorDetails error={this.state.error} errorInfo={this.state.errorInfo} />
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 gap-2 h-11"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })} 
                  variant="outline"
                  className="flex-1 gap-2 h-11"
                  size="lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                  If this problem persists, please contact support with the error details above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}