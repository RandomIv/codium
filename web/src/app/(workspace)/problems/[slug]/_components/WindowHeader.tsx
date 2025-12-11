export default function WindowHeader({ text }: { text: string }) {
  return (
    <div className="bg-muted w-full rounded-5xl p-2 shadow-2xl shadow-muted/50 text-center font-bold ">
      {text}
    </div>
  );
}
