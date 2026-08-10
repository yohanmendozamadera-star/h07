import { getCurrentUser } from "@/lib/permissions";
import { getProfileDetails } from "@/lib/perfil/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { ProfileForm } from "@/components/perfil/profile-form";

export default async function MiPerfilPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <ModulePlaceholder title="Mi perfil" description="No se pudo cargar tu perfil." denied />;
  }

  const profile = await getProfileDetails(user.userId);
  if (!profile) {
    return <ModulePlaceholder title="Mi perfil" description="No se pudo cargar tu perfil." denied />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Mi perfil</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
