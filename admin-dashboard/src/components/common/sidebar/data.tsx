import {
  AlphabetIcon,
  CalendarIcon,
  HomeIcon,
  PieChartIcon,
  TableIcon,
  UserIcon,
  Widget4Icon,
  WindowIcon,
} from "./icon";

export const NAV_DATA = [
  {
    label: "STUDIO WORKSPACE",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: <HomeIcon />,
        items: [],
      },
      {
        title: "Works & Portfolio",
        icon: <Widget4Icon />,
        items: [
          { title: "All Works", url: "/works" },
          { title: "Add New Work", url: "/works/add" },
        ],
      },
      {
        title: "Content Calendar",
        url: "/calendar",
        icon: <CalendarIcon />,
        items: [],
      },
      {
        title: "Task List",
        url: "/tasks",
        icon: <TableIcon />,
        items: [],
      },
      {
        title: "Email Inbox",
        url: "/email",
        icon: <UserIcon />,
        items: [],
      },
      {
        title: "Payment Invoices",
        url: "/invoices",
        icon: <TableIcon />,
        items: [],
      },
      {
        title: "Notifications",
        url: "/notifications",
        icon: <AlphabetIcon />,
        items: [],
      },
      {
        title: "Analytics & GeoIP",
        url: "/analytics",
        icon: <PieChartIcon />,
        items: [],
      },
    ],
  },
  {
    label: "SITE CUSTOMIZATION",
    items: [
      {
        title: "Form Customizer",
        icon: <AlphabetIcon />,
        items: [
          { title: "Contact Form", url: "/forms/contact" },
          { title: "Case Studies Form", url: "/forms/case-studies" },
          { title: "AI Production Form", url: "/forms/ai-production" },
          { title: "Brand Films Form", url: "/forms/brand-films" },
        ],
      },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      {
        title: "Settings",
        icon: <WindowIcon />,
        items: [
          { title: "Gemini AI Key", url: "/settings/integrations" },
          { title: "Site & CPP Partners", url: "/settings/site" },
        ],
      },
    ],
  },
];
