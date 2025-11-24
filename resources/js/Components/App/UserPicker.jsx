import { Fragment, useEffect, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

export default function UserPicker({ value, options, onSelect }) {
    const [selected, setSelected] = useState(value || []);
    const [query, setQuery] = useState("");

    // Sincroniza cuando el padre cambia el value (ej: al editar grupo)
    useEffect(() => {
        setSelected(value || []);
    }, [value]);

    const filteredPeople =
        query === ""
            ? options
            : options.filter((person) =>
                  person.name
                      .toLowerCase()
                      .replace(/\s+/g, "")
                      .includes(query.toLowerCase().replace(/\s+/g, ""))
              );

    const onSelected = (persons) => {
        setSelected(persons);
        onSelect(persons);
    };

    return (
        <>
            <Combobox value={selected} onChange={onSelected} multiple>
                <div className="relative mt-1">
                    <div
                        className="relative w-full cursor-default overflow-hidden rounded-lg 
                        bg-gray-900 text-left shadow-md ring-1 
                        ring-gray-700 focus:outline-none 
                        focus-visible:ring-2 focus-visible:ring-indigo-500 
                        sm:text-sm"
                    >
                        <Combobox.Input
                            className="border-gray-700 bg-gray-950 text-gray-300 
                            focus:border-indigo-500 focus:ring-indigo-500 
                            rounded-md shadow-sm px-3 py-2 block w-full"
                            displayValue={(persons) =>
                                persons.length
                                    ? `${persons.length} usuarios seleccionados`
                                    : ""
                            }
                            placeholder="Seleccionar usuarios..."
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>

                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <Combobox.Options
                            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto 
                            rounded-md bg-gray-900 py-1 text-base shadow-lg 
                            ring-1 ring-black/5 focus:outline-none sm:text-sm"
                        >
                            {filteredPeople.length === 0 && query !== "" ? (
                                <div className="relative cursor-default select-none px-4 py-2 text-gray-400">
                                    Nothing found.
                                </div>
                            ) : (
                                filteredPeople.map((person) => (
                                    <Combobox.Option
                                        key={person.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4
                                            ${
                                                active
                                                    ? "bg-indigo-600 text-white"
                                                    : "text-gray-100"
                                            }`
                                        }
                                        value={person}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${
                                                        selected
                                                            ? "font-medium"
                                                            : "font-normal"
                                                    }`}
                                                >
                                                    {person.name}
                                                </span>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active
                                                                ? "text-white"
                                                                : "text-indigo-400"
                                                        }`}
                                                    >
                                                        <CheckIcon
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>

            {selected && selected.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                    {selected.map((person) => (
                        <span
                            key={person.id}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs"
                        >
                            {person.name}
                        </span>
                    ))}
                </div>
            )}
        </>
    );
}
