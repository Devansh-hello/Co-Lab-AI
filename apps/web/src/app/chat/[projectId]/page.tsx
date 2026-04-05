import App from "../../../screens/App";
import { ProtectedPage } from "../../../components/ProtectedPage";

type ChatPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { projectId } = await params;

  return (
    <ProtectedPage>
      <App projectId={projectId} />
    </ProtectedPage>
  );
}
