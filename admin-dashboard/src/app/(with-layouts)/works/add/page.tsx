import WorkForm from "@/components/works/work-form";

export const metadata = {
  title: "Add New Work",
};

export default function AddWorkPage() {
  return (
    <div className="mt-6 space-y-5 px-2 lg:px-6">
      <div>
        <h1 className="text-[28px] leading-8 font-semibold text-text-primary">Add New Work</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Publish a YouTube 4K muted autoplay work or upload video media with AI trilingual copy.
        </p>
      </div>
      <WorkForm />
    </div>
  );
}
