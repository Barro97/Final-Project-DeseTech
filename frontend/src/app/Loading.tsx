import { LoadingSpinner } from "./components/atoms/loading-spinner";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
}
