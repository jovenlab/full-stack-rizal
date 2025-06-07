export default function TypingSpinner() {
  return (
    <div className="flex items-center space-x-1 px-4 py-2 bg-gray-100 rounded-full w-fit">
      <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2 h-2 bg-[#704214] rounded-full animate-bounce" />
    </div>
  );
}