import { ResourceManager } from '@/components/admin/resource-manager';

export default function Page() {
  return (
    <ResourceManager
      resource="roadmap-steps"
      idKey="slug"
      title="Roadmap steps"
    />
  );
}
