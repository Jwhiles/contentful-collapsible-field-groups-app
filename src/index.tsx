import * as React from "react";
import { render } from "react-dom";
import {
  AppExtensionSDK,
  BaseExtensionSDK,
  DialogExtensionSDK,
  EditorExtensionSDK,
  init,
  locations,
} from "contentful-ui-extensions-sdk";
import "@contentful/forma-36-react-components/dist/styles.css";
import "@contentful/forma-36-fcss/dist/styles.css";
import "./index.css";
import { renderMarkdownDialog } from "@contentful/field-editor-markdown";
import { renderRichTextDialog } from "@contentful/field-editor-rich-text";
import EntryEditor from "./EntryEditor";
import Config from "./ConfigScreen";

interface AppProps {
  sdk: EditorExtensionSDK;
}

interface AppInstallationParameters {
  defaultValue: string;
}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

interface ConfigState {
  parameters: AppInstallationParameters;
}

function renderAtRoot(element: JSX.Element) {
  render(element, document.getElementById("root"));
}

init((sdk: BaseExtensionSDK) => {
  const root = document.getElementById("root");

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    renderAtRoot(<Config sdk={(sdk as unknown) as AppExtensionSDK} />);
  } else if (sdk.location.is(locations.LOCATION_ENTRY_EDITOR)) {
    // Depending on the location the SDK will have different methods
    render(<EntryEditor sdk={(sdk as unknown) as EditorExtensionSDK} />, root);
  } else if (sdk.location.is(locations.LOCATION_DIALOG)) {
    const dialogSdk = (sdk as unknown) as DialogExtensionSDK;
    const invocationParams = sdk.parameters.invocation as { type: string };
    if (invocationParams.type.startsWith("markdown")) {
      renderAtRoot(renderMarkdownDialog(dialogSdk as any));
    } else if (invocationParams.type.startsWith("rich-text")) {
      renderAtRoot(renderRichTextDialog(dialogSdk as any));
    }
  }
});
