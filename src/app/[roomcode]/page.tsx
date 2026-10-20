import { Suspense, use } from "react";
import RoomClient from "@/components/RoomClient";
import { Loader2 } from "lucide-react";

interface RoomPageProps {
  params: Promise<{ roomcode: string }>;
}

function RoomContent({ params }: RoomPageProps) {
  const { roomcode } = use(params);
  return <RoomClient roomcode={roomcode} />;
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      }
    >
      <RoomContent params={params} />
    </Suspense>
  );
}
