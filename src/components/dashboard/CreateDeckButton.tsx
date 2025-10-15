import { Button } from "@/components/ui/button";

interface CreateDeckButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function CreateDeckButton({ onClick, disabled }: CreateDeckButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="default"
      title={disabled ? "Maximum deck limit reached (10/10)" : "Create a new deck"}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Create New Deck
    </Button>
  );
}
