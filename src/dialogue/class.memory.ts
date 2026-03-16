import {
  Settings,
  SettingsContainer,
} from "@/settings/class.SettingsContainer";
import { useSettings } from "@/settings/useSettings";
import { IMemory } from "@/types";
import * as memoryApi from "@/api/memory";
import { isPlainObject } from "@/utils/lodash";
import { inspect } from "util";
import { errors } from "@/errors";

export interface MemoryOptions {
  onRemoved?: () => void;
}

export class Memory {
  #id: string;
  #namespace?: string;
  #label?: string;
  #description?: string;
  #value: IMemory["value"];
  #metadata: IMemory["metadata"];
  #created: string;
  #modified: string;
  #tags: string[] = [];

  #isDirty = false;
  #settings: SettingsContainer;
  #onRemoved?: () => void;

  constructor(
    memory: IMemory,
    settings?: SettingsContainer | Partial<Settings>,
    options?: MemoryOptions
  ) {
    this.#settings = useSettings(settings);
    this.#onRemoved = options?.onRemoved;
    this.#setProperties(memory);
  }

  #setProperties(memory: IMemory): void {
    // Required
    if (!memory?.id || typeof memory.id !== "string") {
      throw errors.invalidParameter("id", "is required and must be a string");
    }
    this.#id = memory.id;

    // Value - required, deep clone if object/array
    if (memory.value === undefined) {
      throw errors.missingParameter("value");
    }

    this.#value =
      typeof memory.value === "object" && memory.value !== null
        ? structuredClone(memory.value)
        : memory.value;

    if (typeof memory.namespace === "string") {
      this.#namespace = memory.namespace;
    }

    if (typeof memory.description === "string") {
      this.#description = memory.description;
    }

    if (typeof memory.label === "string") {
      this.#label = memory.label;
    }

    // Timestamps - default to now if missing
    const now = new Date().toISOString();
    this.#created = typeof memory.created === "string" ? memory.created : now;
    this.#modified =
      typeof memory.modified === "string" ? memory.modified : this.#created;

    // Objects - deep clone
    if (isPlainObject(memory.metadata)) {
      this.#metadata = structuredClone(memory.metadata);
    }

    if (Array.isArray(memory.tags)) {
      if (memory.tags.every((a) => typeof a === "string")) {
        this.#tags = [...memory.tags];
      } else {
        throw errors.invalidParameter("tags", "must be array of strings");
      }
    }
  }

  get id(): string {
    return this.#id;
  }

  get namespace(): string | undefined {
    return this.#namespace;
  }

  get label(): string | undefined {
    return this.#label;
  }

  get description(): string | undefined {
    return this.#description;
  }

  get value(): Readonly<IMemory["value"]> {
    if (typeof this.#value === "object" && this.#value !== null) {
      return structuredClone(this.#value);
    }
    return this.#value;
  }

  get metadata(): Readonly<Record<string, string | number | boolean>> {
    return structuredClone(this.#metadata);
  }

  get created(): string {
    return this.#created;
  }

  get modified(): string {
    return this.#modified;
  }

  get tags(): string[] {
    return [...this.#tags];
  }

  set tags(value: string[]) {
    if (!Array.isArray(value)) {
      throw errors.invalidParameter("tags", "must be an array");
    }
    if (!value.every((t) => typeof t === "string")) {
      throw errors.invalidParameter("tags", "must be array of strings");
    }
    this.#tags = [...value];
    this.#isDirty = true;
  }

  get isDirty(): boolean {
    return this.#isDirty;
  }

  /**
   * Set tags and save immediately
   */
  async saveTags(tags: string[]): Promise<void> {
    this.tags = tags;
    await this.save();
  }

  /**
   * Save pending changes to the API
   */
  async save(): Promise<void> {
    if (!this.#isDirty) return;

    const updated = await memoryApi.update(
      { id: this.#id, tags: this.#tags, ...(this.#namespace !== undefined && { namespace: this.#namespace }) },
      this.#settings
    );

    this.#modified = updated.modified;
    this.#tags = updated.tags ?? [];
    this.#isDirty = false;
  }

  async remove(): Promise<void> {
    await memoryApi.remove({ id: this.#id, ...(this.#namespace !== undefined && { namespace: this.#namespace }) }, this.#settings);
    this.#onRemoved?.();
  }

  toJSON() {
    return {
      id: this.#id,
      ...(this.#namespace !== undefined && { namespace: this.#namespace }),
      ...(this.#label !== undefined && { label: this.#label }),
      ...(this.#description !== undefined && {
        description: this.#description,
      }),
      value:
        typeof this.#value === "object" && this.#value !== null
          ? structuredClone(this.#value)
          : this.#value,
      metadata: structuredClone(this.#metadata),
      tags: [...this.#tags],
      created: this.#created,
      modified: this.#modified,
    };
  }

  [inspect.custom]() {
    return this.toJSON();
  }
}
