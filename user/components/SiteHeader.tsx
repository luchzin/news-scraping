import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "National", href: "/category/national" },
  { label: "International", href: "/category/international" },
  { label: "CVE Watch", href: "/category/cve-watch" },
];

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#1877F2">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M13.5 21v-7.6h2.5l.4-3h-2.9V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.24C16.3 4.17 15.35 4 14.24 4c-2.32 0-3.9 1.42-3.9 4.02v2.38H7.8v3h2.54V21h3.16z"
        fill="white"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#29B6F6">
      <circle cx="12" cy="12" r="12" fill="#29B6F6" />
      <path
        d="M17.6 7.2 15.9 17c-.13.6-.47.74-.96.46l-2.65-1.96-1.28 1.23c-.14.14-.26.26-.53.26l.19-2.7 4.92-4.44c.21-.19-.05-.3-.33-.11l-6.08 3.83-2.62-.82c-.57-.18-.58-.57.12-.84l10.24-3.95c.47-.17.88.11.72.84z"
        fill="white"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="black">
      <circle cx="12" cy="12" r="12" fill="black" />
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SiteHeader() {
  return (
    <header>
      <div className="bg-navy px-4 py-6 text-center text-white sm:py-8 md:py-10">
        <Link href="/">
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
            Cambodia Cyber Hub
          </h1>
        </Link>
        <p className="mt-2 text-xs text-blue-100 sm:text-sm md:text-lg">
          Cybersecurity news &amp; advisories
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-y-2 bg-brandred px-3 py-2 text-white sm:px-6 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#" aria-label="Facebook">
            <FacebookIcon />
          </a>
          <a href="#" aria-label="Telegram">
            <TelegramIcon />
          </a>
          <a href="#" aria-label="X">
            <XIcon />
          </a>
        </div>

        <nav className="order-3 mt-1 flex w-full justify-center gap-3 overflow-x-auto text-xs font-medium sm:order-none sm:mt-0 sm:w-auto sm:gap-6 sm:text-sm md:gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <SearchBox />
        </div>
      </div>
    </header>
  );
}