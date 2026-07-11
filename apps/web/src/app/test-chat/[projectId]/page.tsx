import TestApp from "../../../screens/TestApp";
import { ProtectedPage } from "../../../components/ProtectedPage";

type ChatPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function TestChatPage({ params }: ChatPageProps) {
  const { projectId } = await params;
  return (
    <ProtectedPage>
      <TestApp projectId={projectId} />
    </ProtectedPage>
  );
}
