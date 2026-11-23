import FormBuilderClient from "./_components/form-builder-client";
import { FORM_TABS } from "./_components/form-tabs";

export function generateStaticParams() {
  return FORM_TABS.map((tab) => ({ formId: tab.id }));
}

export default async function FormBuilderPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormBuilderClient formId={formId} />;
}
