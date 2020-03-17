/* eslint-disable camelcases */
class BlockBuilder {
  static createInput(params = {}) {
    return {
      type: 'input',
      label: BlockBuilder.createLabel(params.label),
      element: params.element,
      ...(params.hint && { hint: params.hint }),
      ...(params.optional && { optional: params.optional }),
    };
  }

  static createSection(params = {}) {
    const fields = params.fields
      && params.fields.length
      && params.fields.map(el => BlockBuilder.createMrkdwnTextObject(el));
    const text = params.text && BlockBuilder.createMrkdwnTextObject(params.text);

    return {
      type: 'section',
      accessory: params.accessory,
      ...(fields && { fields }),
      ...(text && { text }),
    };
  }

  static createAction(elements = []) {
    return {
      type: 'actions',
      elements,
    };
  }

  static createTextObject(type, text, emoji = true, verbatim = false) {
    if (type === 'plain_text') {
      return { type, text, emoji };
    } if (type === 'mrkdwn') {
      return { type, text, verbatim };
    }
    throw new Error('Wrong text object');
  }

  static createPlainTextObject(text = 'text', emoji = true) {
    return BlockBuilder.createTextObject('plain_text', text, emoji);
  }

  static createMrkdwnTextObject(text = 'text', verbatim = false) {
    return BlockBuilder.createTextObject('mrkdwn', text, undefined, verbatim);
  }

  static createLabel(text = 'label') {
    return BlockBuilder.createPlainTextObject(text);
  }

  static serializeValue(value) {
    if (!value) {
      return '';
    }
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  static createButton(params = {}) {
    return {
      type: 'button',
      text: BlockBuilder.createPlainTextObject(params.text),
      value: BlockBuilder.serializeValue(params.value),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.url && { url: params.actionurl_id }),
      ...(params.style && { action_id: params.style }),
      ...(params.confirm && { action_id: params.confirm }),
    };
  }

  static createInputField(params = {}) {
    return {
      type: 'plain_text_input',
      placehoder:
        params.placeholder
        && BlockBuilder.createPlainTextObject(params.placehoder),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.initial_value && { initial_value: params.initial_value }),
      ...(params.multiline && { multiline: params.multiline }),
      ...(params.min_length && { min_length: params.min_length }),
      ...(params.max_length && { max_length: params.max_length }),
    };
  }

  static createMultilineInputField(params = {}) {
    return BlockBuilder.createInputField({ ...params, multiline: true });
  }

  static createDatepicker(params = {}) {
    return {
      type: 'datepicker',
      placehoder:
        params.placeholder
        && BlockBuilder.createPlainTextObject(params.placehoder),
      ...(params.initial_date && { initial_date: params.initial_date }),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.confirm && { confirm: params.confirm }),
    };
  }

  static createCheckboxes(params = {}) {
    return {
      type: 'checkboxes',
      options: params.options || [],
      ...(params.initial_options && { initial_options: params.initial_options }),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.confirm && { confirm: params.confirm }),
    };
  }

  static createBaselineSelect(params = {}) {
    return {
      placeholder: BlockBuilder.createPlainTextObject(params.placehoder),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.confirm && { confirm: params.confirm }),
    };
  }

  static createBaselineMultiSelect(params = {}) {
    return {
      placeholder: BlockBuilder.createPlainTextObject(params.placehoder),
      ...(params.action_id && { action_id: params.action_id }),
      ...(params.confirm && { confirm: params.confirm }),
      ...(params.max_selected_items && { max_selected_items: params.max_selected_items }),
    };
  }


  static createStaticSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineSelect(params),
      type: 'static_select',
      options: params.options || [],
      ...(params.option_groups && { option_groups: params.option_groups }),
      ...(params.initial_option && { initial_option: params.initial_option }),
    };
  }

  static createMultiStaticSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineMultiSelect(params),
      type: 'multi_static_select',
      options: params.options || [],
      ...(params.option_groups && { option_groups: params.option_groups }),
      ...(params.initial_options && { initial_options: params.initial_options }),
    };
  }

  static createExternalSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineSelect(params),
      type: 'external_select',
      ...(params.min_query_length && { min_query_length: params.min_query_length }),
      ...(params.initial_option && { initial_option: params.initial_option }),
    };
  }

  static createMultiExternalSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineMultiSelect(params),
      type: 'multi_external_select',
      ...(params.initial_options && { initial_options: params.initial_options }),
    };
  }

  static createUserSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineSelect(params),
      type: 'users_select',
      ...(params.initial_user && { initial_user: params.initial_user }),
    };
  }

  static createMultiUserSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineMultiSelect(params),
      type: 'multi_users_select',
      ...(params.initial_users && { initial_users: params.initial_users }),
    };
  }

  static createConversatonSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineSelect(params),
      type: 'conversations_select',
      ...(params.initial_conversation && { initial_conversation: params.initial_conversation }),
    };
  }

  static createMultiConversationSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineMultiSelect(params),
      type: 'multi_conversations_select',
      ...(params.initial_conversations && { initial_conversations: params.initial_conversations }),

    };
  }

  static createChannelSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineSelect(params),
      type: 'channels_select',
      ...(params.initial_channel && { initial_channel: params.initial_channel }),
    };
  }

  static createMultiChannelSelect(params = {}) {
    return {
      ...BlockBuilder.createBaselineMultiSelect(params),
      type: 'multi_channels_select',
      ...(params.initial_channels && { initial_channels: params.initial_channels }),

    };
  }

  static createContext(params = {}) {
    return {
      type: 'context',
      elements: params.elements,
      ...(params.block_id && { block_id: params.block_id }),

    };
  }

  static createDivider(params = {}) {
    return {
      type: 'divider',
      ...(params.block_id && { block_id: params.block_id }),
    };
  }

  static createImage(params = {}) {
    return {
      type: 'image',
      ...(params.image_url && { image_url: params.image_url }),
      ...(params.alt_text && { alt_text: params.alt_text }),
      ...(params.title && { title: params.title }),
      ...(params.block_id && { block_id: params.block_id }),

    };
  }

  static createFile(params = {}) {
    return {
      type: 'file',
      source: 'remote',
      ...(params.external_id && { external_id: params.external_id }),
      ...(params.block_id && { block_id: params.block_id }),
    };
  }
}

module.exports = BlockBuilder;
