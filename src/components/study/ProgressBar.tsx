import { Progress } from "../ui/progress";

interface ProgressBarProps {
  currentIndex: number;
  totalCards: number;
}

export function ProgressBar({ currentIndex, totalCards }: ProgressBarProps) {
  const currentCardNumber = currentIndex + 1;
  const progressPercentage = (currentCardNumber / totalCards) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Card {currentCardNumber} of {totalCards}
        </span>
        <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
