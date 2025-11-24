import { Popover, Transition } from "@headlessui/react";
import { UsersIcon } from "@heroicons/react/24/solid";
import { Fragment } from "react";
import UserAvatar from "./UserAvatar";
import { Link } from "@inertiajs/react";

export default function GroupUsersPopover({ users = [] }) {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`${
              open ? "text-gray-100" : "text-gray-400"
            } hover:text-gray-200 transition`}
          >
            <UsersIcon className="w-5" />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition-all ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition-all ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-20 mt-3 w-[220px] px-4 sm:px-0">
              <div className="overflow-hidden rounded-xl shadow-xl backdrop-blur bg-gray-900/80 ring-1 ring-white/10">
                <div className="py-2">

                  {users.length === 0 && (
                    <div className="text-center text-gray-400 py-3 text-sm">
                      No hay usuarios
                    </div>
                  )}

                  {users.map((user, i) => (
                    <div key={user.id}>
                      <Link
                        href={route("chat.user", user.id)}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700/40 transition rounded-md"
                      >
                        <UserAvatar user={user} className="w-8 h-8" />

                        <div className="flex flex-col">
                          <span className="text-sm text-gray-200 font-medium">
                            {user.name}
                          </span>
                        </div>
                      </Link>

                      {i < users.length - 1 && (
                        <div className="border-t border-gray-700/40 mx-3 my-1"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
