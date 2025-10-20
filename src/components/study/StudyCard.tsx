import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

interface StudyCardProps {
  frontText: string;
  backText: string;
  isFlipped: boolean;
  onFlip: () => void;
}

// Calculate appropriate font size based on text length
function getFontSizeClass(text: string): string {
  const length = text.length;

  if (length <= 50) return "text-2xl";
  if (length <= 100) return "text-xl";
  if (length <= 200) return "text-lg";
  if (length <= 300) return "text-base";
  if (length <= 400) return "text-sm";
  return "text-xs"; // For 400-500+ chars
}

export function StudyCard({ frontText, backText, isFlipped, onFlip }: StudyCardProps) {
  return (
    <div className="w-full max-w-3xl max-h-full perspective-1000">
      <div
        className={cn(
          "relative transition-transform duration-500 cursor-pointer",
          "transform-style-3d w-full min-h-[300px]",
          isFlipped && "rotate-y-180"
        )}
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Show front of card" : "Show back of card"}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front side */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden",
            "hover:shadow-lg flex flex-col bg-blue-50 dark:bg-blue-950/20"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="pt-4 pb-2 text-center">
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-medium">
              Front
            </span>
          </div>
          <CardContent className="flex-1 flex items-center justify-center p-6 w-full overflow-auto">
            <div className="prose dark:prose-invert mx-auto text-center max-w-full">
              <p className={cn(getFontSizeClass(frontText), "leading-relaxed")}>{frontText}</p>
            </div>
          </CardContent>
        </Card>

        {/* Back side */}
        <Card
          className={cn(
            "absolute inset-0 backface-hidden",
            "hover:shadow-lg flex flex-col bg-purple-50 dark:bg-purple-950/20"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="pt-4 pb-2 text-center">
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/40 px-3 py-1 text-xs font-medium">
              Back
            </span>
          </div>
          <CardContent className="flex-1 flex items-center justify-center p-6 w-full overflow-auto">
            <div className="prose dark:prose-invert mx-auto text-center max-w-full">
              <p className={cn(getFontSizeClass(backText), "leading-relaxed")}>{backText}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
