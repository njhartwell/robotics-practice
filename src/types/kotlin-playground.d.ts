declare module "kotlin-playground" {
  interface PlaygroundOptions {
    server?: string;
    version?: string;
    callback?: (targetNode: HTMLElement, mountNode: HTMLElement) => void;
    onChange?: (code: string) => void;
    onRun?: () => void;
    onError?: () => void;
    onTestPassed?: () => void;
    onTestFailed?: (error: string) => void;
    onConsoleOpen?: () => void;
    onConsoleClose?: () => void;
    getInstance?: (instance: PlaygroundInstance) => void;
  }

  interface PlaygroundInstance {
    getCode(): string;
    execute(): void;
    destroy(): void;
  }

  function playground(
    target: string | HTMLElement | NodeList,
    options?: PlaygroundOptions
  ): Promise<PlaygroundInstance[]>;

  export default playground;
}
