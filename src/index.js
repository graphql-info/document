const { html } = require('@popeindustries/lit-html-server');
const { unsafeHTML } = require('@popeindustries/lit-html-server/directives/unsafe-html');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const generateExample = require('./generateExample');

loadLanguages(['graphql']);

module.exports = {
    render: (ref, schema, type, originalRenderer) => {
        const page = originalRenderer(ref, schema);
        const example = generateExample(ref, schema);
        page.push({
            name: 'example',
            type: 'lit-html',
            value: html`
                <div class="example">
                    <h3>Example:</h3>
                    <section class="code">
                        <pre class="language-graphql">${unsafeHTML(prism.highlight(example.document, prism.languages.graphql, 'graphql'))}</pre>
                    </section>
                </div>`
        });
        return page;
    }
};
