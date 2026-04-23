import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, MapPin, BookOpen } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { USERS, BOOKS } from "@/data/mock";
import type { User } from "@/types";
import StarRating from "@/components/shared/StarRating";
import { cn } from "@/lib/utils";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { id }      = useParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const profileId = id ?? currentUser?.id;
  const profile   = USERS.find((u) => u.id === profileId) ?? USERS[0];

  const handle     = profile.email.split("@")[0];
  const isVerified = profile.reviewCount >= 20 || profile.rating >= 4.9;

  const genres = useMemo(
    () => [...new Set(BOOKS.filter((b) => b.ownerId === profile.id).map((b) => b.genre))],
    [profile.id]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <ProfileHeader profile={profile} handle={handle} isVerified={isVerified} />
      <ProfileAbout  profile={profile} genres={genres} />
    </div>
  );
}

// ─── Profile header ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  profile:    User;
  handle:     string;
  isVerified: boolean;
}

function ProfileHeader({ profile, handle, isVerified }: ProfileHeaderProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-white shadow-sm">

      {/* ── Cover ─────────────────────────────────────────────────────────── */}
      <div className="relative h-44 overflow-hidden rounded-t-3xl bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800">
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full opacity-[0.13]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="profile-dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-dots)" />
        </svg>
        <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-14 right-10  w-60 h-60 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-4   right-1/3    w-32 h-32 rounded-full bg-purple-300/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* ── Avatar + identity ─────────────────────────────────────────────── */}
      <div className="px-6 sm:px-8">
        <div className="-mt-14 relative z-10 inline-block">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-2xl"
            />
            {isVerified && (
              <span
                aria-label="Verificado"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center ring-2 ring-white shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pb-7 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">
              {profile.name}
            </h1>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold leading-none">
                <ShieldCheck className="w-3 h-3" />
                Verificado
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">@{handle}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRating value={profile.rating} size="md" showValue />
            <span className="text-sm text-muted-foreground">· {profile.reviewCount} reseñas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Profile about ────────────────────────────────────────────────────────────

interface ProfileAboutProps {
  profile: User;
  genres:  string[];
}

function ProfileAbout({ profile, genres }: ProfileAboutProps) {
  return (
    <div className="rounded-3xl border border-border/60 bg-white shadow-sm px-6 sm:px-8 py-6 space-y-5">

      {/* Bio */}
      <p className="text-sm text-foreground/80 leading-relaxed">
        {profile.bio}
      </p>

      <div className="border-t border-border/50" />

      {/* Location */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
        </div>
        <span className="text-sm text-muted-foreground">{profile.location}</span>
      </div>

      <div className="border-t border-border/50" />

      {/* Genres */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
          Géneros en su colección
        </p>
        {genres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <span
                key={genre}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  "bg-violet-50 text-violet-700 border border-violet-100/80",
                  "transition-colors hover:bg-violet-100"
                )}
              >
                <BookOpen className="w-3 h-3 flex-shrink-0" />
                {genre}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin géneros registrados.</p>
        )}
      </div>

    </div>
  );
}
