import { ResourceManager } from '@/components/admin/resource-manager';

export default function Page() {
  return (
    <ResourceManager
      resource="housing-offices"
      idKey="id"
      title="Housing offices"
    />
  );
}
