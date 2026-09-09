type Variant = "outline-blue" | "solid-red" | "light-red" | "outline-red" | "outline-gray";

const VARIANT_CLASSES: Record<Variant, string> = {
  "outline-blue": "border border-blue-500 text-blue-700 bg-white",
  "solid-red": "bg-red-600 text-white border border-red-600",
  "light-red": "bg-red-100 text-red-600 border border-red-100",
  "outline-red": "border border-red-400 text-red-500 bg-white",
  "outline-gray": "border border-gray-300 text-gray-600 bg-white",
};

export default function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  return (
    <span
      className={`inline-block rounded-md px-3 py-1 text-xs font-medium ${VARIANT_CLASSES[variant]}`}
    >
      {label}
    </span>
  );
}

// Convenience mapper so pages don't need to know the variant names.
export function badgeForArticleStatus(status: string) {
  switch (status) {
    case "published":
      return { label: "Published", variant: "outline-blue" as const };
    case "pending":
      return { label: "Pending", variant: "light-red" as const };
    case "rejected":
      return { label: "Rejected", variant: "solid-red" as const };
    case "approved":
      return { label: "Approved", variant: "outline-blue" as const };
    default:
      return { label: "Draft", variant: "outline-gray" as const };
  }
}

export function badgeForChannelStatus(status: string) {
  switch (status) {
    case "live":
      return { label: "Live", variant: "outline-blue" as const };
    case "connected":
      return { label: "Connected", variant: "outline-blue" as const };
    case "setup_needed":
      return { label: "Setup needed", variant: "outline-red" as const };
    default:
      return { label: status, variant: "outline-gray" as const };
  }
}
