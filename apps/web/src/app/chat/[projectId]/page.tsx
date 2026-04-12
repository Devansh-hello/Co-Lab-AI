"use client"

import App from "../../../screens/App";
import { ProtectedPage } from "../../../components/ProtectedPage";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  return (
    <ProtectedPage>
      <App projectId={projectId} />
    </ProtectedPage>
  );
}
