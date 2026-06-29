// Status badge component for job requests, proposals, candidates, and agencies

interface StatusBadgeProps {
  status: string;
  variant: "job" | "proposal" | "candidate" | "agency";
}

const jobColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  CLOSED: "bg-orange-100 text-orange-700",
  FILLED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const jobLabels: Record<string, string> = {
  DRAFT: "مسودة",
  OPEN: "مفتوح",
  CLOSED: "مغلق",
  FILLED: "مكتمل",
  CANCELLED: "ملغي",
};

const proposalColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

const proposalLabels: Record<string, string> = {
  SUBMITTED: "مقدم",
  SHORTLISTED: "مدرج في القائمة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  WITHDRAWN: "مسحوب",
};

const candidateColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  VIEWED: "bg-gray-100 text-gray-700",
  SHORTLISTED: "bg-yellow-100 text-yellow-700",
  INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700",
  OFFER_MADE: "bg-green-100 text-green-700",
  HIRED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
};

const candidateLabels: Record<string, string> = {
  SUBMITTED: "مقدم",
  VIEWED: "تمت المشاهدة",
  SHORTLISTED: "مدرج",
  INTERVIEW_SCHEDULED: "مقابلة مجدولة",
  OFFER_MADE: "عرض مقدم",
  HIRED: "تم التوظيف",
  REJECTED: "مرفوض",
};

const agencyColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const agencyLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  REJECTED: "مرفوض",
};

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  let colorClass = "bg-gray-100 text-gray-700";
  let label = status;

  if (variant === "job") {
    colorClass = jobColors[status] ?? colorClass;
    label = jobLabels[status] ?? status;
  } else if (variant === "proposal") {
    colorClass = proposalColors[status] ?? colorClass;
    label = proposalLabels[status] ?? status;
  } else if (variant === "candidate") {
    colorClass = candidateColors[status] ?? colorClass;
    label = candidateLabels[status] ?? status;
  } else if (variant === "agency") {
    colorClass = agencyColors[status] ?? colorClass;
    label = agencyLabels[status] ?? status;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
