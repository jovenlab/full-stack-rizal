import ActionButton, {
  ButonSize,
  ButtonVariant,
} from "@/src/components/ActionButton";
import { Edit } from "lucide-react";

interface ChatHeaderProps {
  onNewChat: () => void;
}

export default function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div
      className="
        flex flex-row
        w-full
        p-4
        bg-peach
        items-center justify-between
      "
    >
      <h1
        className="
          text-blue text-3xl font-maragsa
        "
      >
        Rizal
        <span
          className="
            text-red
          "
        >
          GPT
        </span>
      </h1>
      <ActionButton
        color="brown"
        label="New Conversation"
        size={ButonSize.Compact}
        variant={ButtonVariant.Filled}
        onClick={onNewChat}
        icon={Edit}
      />
    </div>
  );
}
