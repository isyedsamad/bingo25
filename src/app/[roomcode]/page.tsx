import RoomClient from "@/components/RoomClient";

export const instant = false;

interface RoomPageProps {
  params: Promise<{ roomcode: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomcode } = await params;
  return <RoomClient roomcode={roomcode} />;
}
