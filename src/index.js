const { html } = require('@popeindustries/lit-html-server');
const { unsafeHTML } = require('@popeindustries/lit-html-server/directives/unsafe-html');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const path = require('path');
const generateExample = require('./generateExample');

loadLanguages(['graphql']);
loadLanguages(['json']);

module.exports = {
    init: () => [{ name: 'css/examples.css', path: path.resolve(__dirname, './assets/css/examples.css') }],
    render: (ref, schema, type, originalRenderer) => {
        const page = originalRenderer(ref, schema);
        const example = generateExample(ref, schema);
        page.push({
            name: 'example',
            type: 'lit-html',
            value: html`
                <div class="example">
                    <div class="example-code">
                        <h3>Example:</h3>
                        <section class="code">
                            <pre class="language-graphql">${unsafeHTML(prism.highlight(`${example.document}\n\n${typeof example.fragments === 'string' ? example.fragments : ''}`, prism.languages.graphql, 'graphql'))}</pre>
                        </section>
                    </div>
                    ${example.inputs && Object.keys(example.inputs).length > 0
                        ? html`
                        <div class="example-inputs">
                            <h3>Example Inputs:</h3>
                            <section class="inputs">
                                <pre class="language-json">${unsafeHTML(prism.highlight(JSON.stringify(example.inputs, null, 2), prism.languages.json, 'json'))}</pre>
                            </section>
                        </div>` : ''}
                </div>`
        });
        return page;
    }
};
