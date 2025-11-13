export function assertDialogue(maybe: Record<string, any> | null) {
  if(!maybe?.id || typeof maybe?.id !== "string"){
    throw new Error("Not a dialogue")
  }
}
