module.exports = `
  {{#each items}}
    <a itemprop="url"
        target="_blank"
        rel="noopener"
        href="{{url}}"
        class="item {{#if artist}}album{{else}}artist{{/if}}"
        title="{{name}}, {{playcount}} scrobbles">
      <span class="info">
        <span class="name">
          {{name}}
        </span>
        {{#if artist}}
          <span class="name">
            {{artist.name}}
          </span>
        {{/if}}
        <span class="scrobbles">
          {{playcount}} scrobbles
        </span>
        <bar style="width: {{percent}}%;"></bar>
      </span>
      {{#if imageSrc}}
        <img lazy src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" data-src="{{imageSrc}}" alt="{{name}}" />
      {{/if}}
    </a>
  {{/each}}
`;
