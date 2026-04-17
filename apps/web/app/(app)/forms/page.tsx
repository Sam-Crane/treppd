import { FileCheck2 } from 'lucide-react';

import { FormsList } from '@/components/forms/forms-list';
import { PageHeader } from '@/components/ui';

export const metadata = {
  title: 'Form Guides — Treppd',
  description:
    'Walk through Germany\u2019s Anmeldung, residence permit, and health insurance forms field-by-field, with plain-English explanations grounded in official sources.',
};

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileCheck2 className="h-6 w-6" />}
        title="Form guides"
        description="Field-by-field walkthroughs for the forms that apply to your visa and Bundesland. Click any field to get a plain-English explanation personalised to your situation."
      />
      <FormsList />
    </div>
  );
}
