/* eslint-disable no-nested-ternary */
const indentSpacing = 2;
const maxDepth = 10;

const getTypeName = (type) => {
    if (type.kind === 'NonNullType' || type.kind === 'ListType') {
        return getTypeName(type.type);
    }
    if (type.ofType) {
        return getTypeName(type.ofType);
    }
    return typeof type.value === 'string' ? type.value : typeof type.name === 'string' ? type.name : type.name.value;
};

const printInput = (root, values) => {
    if (Array.isArray(root.arguments) && root.arguments.length > 0) {
        return `(${root.arguments.map((item) => {
            let name = getTypeName(item);
            if (values.inputs[name]) {
                name = `${name}${Object.keys(values.inputs).filter((input) => input.startsWith(name)).length || ''}`;
            }
            values.inputs[name] = item;
            return `${getTypeName(item)}: $${name}`;
        }).join(', ')})`;
    }
    return '';
};

const printUnion = (root, schema, fragments, values, indentLevel) => {
    const indent = ''.padStart(indentLevel * indentSpacing, ' ');
    return `{\n${root.types.map((type) => `${indent}... on ${type.name.value} ${printFields({ astNode: { type: { value: type.name.value }, ...type } }, schema, fragments, values, indentLevel + 1)}`).filter((x) => x).join('\n')}${indent}}\n`;
};

const printObject = (root, schema, fragments, values, indentLevel) => {
    const indent = ''.padStart(indentLevel * indentSpacing, ' ');
    const parentIdent = ''.padStart((indentLevel - 1) * indentSpacing, ' ');
    if (root.fields && Array.isArray(root.fields) && root.fields.length > 0) {
        return `{\n${root.fields.map((field) => `${printObject(field, schema, fragments, values, indentLevel)}\n`).filter((x) => x !== '\n').join('')}${parentIdent}}`;
    }
    const parentType = schema.getType(getTypeName(root.type));
    if (parentType.constructor.name === 'GraphQLObjectType') {
        const typeName = getTypeName(root.type);
        if (!values.fragments[typeName]) {
            values.fragments[typeName] = 1;
        } else {
            values.fragments[typeName] += 1;
            return `${indent}${root.name.value} {\n${''.padStart((indentLevel + 1) * indentSpacing, ' ')}...${typeName}Fragment\n${indent}}`;
        }
        if (indentLevel > maxDepth) {
            return '';
        }
        return `${indent}${root.name.value}${printInput(root, values)} ${printFields(root, schema, fragments, values, indentLevel + 1)}`;
    }
    if (indentLevel > maxDepth) {
        return '';
    }
    if (parentType.constructor.name === 'GraphQLUnionType') {
        return parentType.astNode.types.map((type) => {
            if (!values.fragments[getTypeName(type)]) {
                values.fragments[getTypeName(type)] = 1;
                return `${indent}... on ${getTypeName(type)} ${printObject(schema.getType(getTypeName(type)).astNode, schema, fragments, values, indentLevel + 1)}`;
            }
            values.fragments[getTypeName(type)] += 1;
            return `${indent}... on ${getTypeName(type)} {\n${indent}  ...${getTypeName(type)}Fragment\n${indent}}}`;
        }).join('\n');
    }
    return `${indent}${root.name.value}`;
};

const printFields = (root, schema, fragments, values, indentLevel) => {
    const parentType = schema.getType(getTypeName(root.astNode ? root.astNode.type : root.type));
    switch (parentType.constructor.name) {
        case 'GraphQLUnionType':
            return printUnion(parentType.astNode, schema, fragments, values, indentLevel);
        case 'GraphQLInterfaceType':
        case 'GraphQLObjectType':
            return printObject(parentType.astNode, schema, fragments, values, indentLevel);
        case 'GraphQLScalarType':
            return '';
        default:
            return '';
    }
};

const printType = (root, schema, fragments) => {
    const output = {
        document: '',
        inputs: {},
        fragments
    };

    const operation = root.name && typeof root.name === 'string';
    if (operation) {
        output.document = `${root.name}${printInput(root.astNode, output)} ${printFields(root, schema, fragments, output, 2)}`;
    }

    return output;
};

const printFragments = (schema, fragments, inputs) => {
    const filteredFragments = Object.fromEntries(Object.entries(fragments).filter(([, value]) => value > 1));
    const renderedFragments = Object.keys(filteredFragments).map((name) => {
        const type = schema.getType(name);
        if (type.astNode && !type.astNode.type) {
            type.astNode.type = { value: name };
        }
        return `fragment ${name}Fragment on ${name} ${printFields(type, schema, {}, { document: '', inputs, fragments: filteredFragments }, 1)}`;
    });
    return renderedFragments.join('\n');
};

const outputInput = (schema, inputs) => {
    const result = {};
    Object.entries(inputs).forEach(([key, value]) => {
        result[key] = {};
        const type = schema.getType(getTypeName(value.type));
        switch (type.constructor.name) {
            case 'GraphQLInputObjectType':
                if (type.astNode && Array.isArray(type.astNode.fields) && type.astNode.fields.length > 0) {
                    type.astNode.fields.forEach((field) => {
                        result[key][field.name.value] = `${getTypeName(field.type)}${field.type.kind === 'NonNullType' ? '!' : ''}`;
                    });
                }
                break;
            case 'GraphQLEnumType':
                result[key] = type.astNode.name.value;
                break;
            case 'GraphQLScalarType':
                result[key] = `${type.name}${value.type.kind === 'NonNullType' ? '!' : ''}`;
                break;
            default:
                break;
        }
        return result;
    });
    return result;
};

const outputInputRegistration = (schema, inputs) => {
    const result = {};
    Object.entries(inputs).forEach(([key, value]) => {
        result[key] = `${getTypeName(value.type)}${value.type.kind === 'NonNullType' ? '!' : ''}`;
    });
    return result;
};

const wrapOutput = (root, schema, output) => {
    const indent = ''.padStart(indentSpacing, ' ');

    const isQuery = schema.getQueryType().getFields()[root.name];

    const inputs = outputInputRegistration(schema, output.inputs);

    const inputList = Object.keys(inputs).length < 5
        ? Object.entries(inputs).map(([key, value]) => `$${key}: ${value}`).join(', ')
        : Object.entries(inputs).map(([key, value]) => `$${key}: ${value}`).join(`, \n${indent}`);

    output.document = `${isQuery ? 'query' : 'mutation'} ${root.name}${Object.keys(inputs).length > 0 ? `(${inputList})` : ''} {\n${indent}${output.document}\n}`;

    return output;
};

const generateExample = (root, schema) => {
    let output = printType(root, schema, {});
    if (Object.keys(output.fragments).filter((x) => output.fragments[x] > 1).length > 0) {
        output = printType(root, schema, Object.fromEntries(Object.entries(output.fragments).filter(([, value]) => value > 1)));
        output.fragments = printFragments(schema, output.fragments, output.inputs);
    }
    output = wrapOutput(root, schema, output);

    output.inputs = outputInput(schema, output.inputs);
    return output;
};

module.exports = generateExample;
