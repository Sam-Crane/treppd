import { ResourceManager } from '@/components/admin/resource-manager';

export default function Page() {
  return (
    <ResourceManager
      resource="requirement-tags"
      idKey="tag"
      title="Requirement tags"
    />
  );
}
