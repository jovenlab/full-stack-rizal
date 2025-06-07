import { Send } from "lucide-react";

interface TextFieldProps {
  placeholder: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled: boolean;
}
export default function ChatInput({
  placeholder,
  value,
  type = "text",
  onChange,
  onClick,
  onKeyDown,
  disabled,
}: TextFieldProps) {
  return (
    <div
      style={{ backgroundColor: "var(--color-sand)" }}
      className="
        flex flex-row
        p-5
        border-0 rounded-lg
        relative gap-1
      "
    >
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`
          w-full
          text-lg font-pica text-brown
          transition-all
          placeholder:text-brown placeholder:opacity-60 focus:outline-none focus:ring-0
        `}
      />

      <button
        disabled={disabled}
        onClick={onClick}
        className="
          cursor-pointer
        "
      >
        <Send size={20} color="var(--color-brown)" />
      </button>
    </div>
  );
}
