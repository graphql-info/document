const { html } = require('@popeindustries/lit-html-server');
const { unsafeHTML } = require('@popeindustries/lit-html-server/directives/unsafe-html');
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const generateQuery = require('./queryGenerator');

loadLanguages(['graphql']);

module.exports = {
    render: (ref, schema, type, originalRenderer) => {
        const page = originalRenderer(ref, schema);
        const query = generateQuery(ref.name, type === 'query' ? 'Query' : 'Mutation', '', {}, {}, [], 0, schema);
        page.push({
            name: 'documents',
            type: 'lit-html',
            value: html`
                <div class="documents">
                    <h3>Documents:</h3>
                    <section class="code">
                        <pre class="language-graphql">${unsafeHTML(prism.highlight(query.queryStr, prism.languages.graphql, 'graphql'))}</pre>
                    </section>
                </div>`
        });
        return page;
    }
};
