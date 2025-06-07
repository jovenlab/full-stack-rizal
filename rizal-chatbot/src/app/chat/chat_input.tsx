import { Send } from "lucide-react";

interface TextFieldProps {
  placeholder: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
  onClick: () => void;
}
export default function ChatInput({
  placeholder,
  value,
  type = "text",
  onChange,
  onClick,
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
        className={`
          w-full
          text-lg font-pica
          transition-all
          placeholder:text-gray-400 focus:outline-none focus:ring-0
        `}
      />

      <button
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
