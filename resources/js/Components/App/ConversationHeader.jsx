import { Link } from "@inertiajs/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import UserAvatar from "./UserAvatar";
import GroupAvatar from "./GroupAvatar";

const ConversationHeader = ({ selectedConversation }) => {
  if (!selectedConversation) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
      {/* Botón de volver (solo en móvil) */}
      <Link
        href={route("dashboard")}
        className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-800 transition"
      >
        <ArrowLeftIcon className="w-5 h-5 text-white" />
      </Link>

      {/* Avatar y nombre */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        {selectedConversation.is_user && (
          <UserAvatar user={selectedConversation} className="w-12 h-12" />
        )}
        {selectedConversation.is_group && (
          <GroupAvatar className="w-12 h-12" />
        )}
        <div className="overflow-hidden">
          <h3 className="text-white text-lg font-semibold truncate">
            {selectedConversation.name}
          </h3>
          {selectedConversation.is_group && (
            <p className="text-gray-400 text-sm truncate">
              {selectedConversation.user_ids.length} members
            </p>
          )}
        </div>
      </div>

      {/* Espacio adicional o botones futuros */}
      <div className="flex items-center gap-2">
        {/* Aquí podrías agregar botones de opciones, llamada, etc. */}
      </div>
    </div>
  );
};

export default ConversationHeader;
