export type List = {
  type: "list";
  dynamic?: boolean;
  isShowingDetail?: boolean;
  items: ListItem[];
};

export type ListItem = {
  icon?: string;
  id?: string;
  detail?: {
    markdown: string;
  };
  title: string;
  actions?: ActionItem[];
};

export type Form = {
  type: "form";
  items: FormItem[];
};

export type FormItemProps = {
  name: string;
  title: string;
  required?: boolean;
};

type TextField = FormItemProps & {
  type: "textfield";
  placeholder?: string;
  value?: string;
};

type TextArea = FormItemProps & {
  type: "textarea";
  placeholder?: string;
  value?: string;
};

type Checkbox = FormItemProps & {
  type: "checkbox";
  label: string;
  title?: string;
  value?: boolean;
};

type Select = FormItemProps & {
  type: "dropdown";
  items: SelectItem[];
  value?: string;
};

type File = FormItemProps & {
  type: "file";
};

type SelectItem = {
  title: string;
  value: string;
};

export type FormItem = TextField | Checkbox | TextArea | Select | File;

export type ActionItem = {
  title: string;
  icon?: string;
  shortcut?: {
    modifiers: string[];
    key: string;
  };
} & Action;

export type Detail = {
  type: "detail";
  markdown: string;
  actions: ActionItem[];
};

export type PushAction = {
  type: "push";
  url: string;
};

export type PopAction = {
  type: "pop";
  reload?: boolean;
};

export type RunAction = {
  type: "run";
  url: string;
  data?: Record<string, any>;
};

export type ReloadAction = {
  type: "reload";
};

export type CopyAction = {
  type: "copy";
  text: string;
};

export type OpenAction = {
  type: "open";
  url: string;
};

export type Action =
  | OpenAction
  | CopyAction
  | RunAction
  | PushAction
  | ReloadAction
  | PopAction;
export type View = {
  title: string;
} & (List | Detail | Form);
