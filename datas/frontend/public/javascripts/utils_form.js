const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function FormcreateElement(tag, classes = [], attributes = {}) {
    const element = document.createElement(tag);
    element.classList.add(...classes);
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'innerText')
            element.innerText = value
        else
            element.setAttribute(key, value);
    }
    return element;
}

export function FormAppendElements(parent, ...children) {
    children.forEach(child => parent.appendChild(child));
}

export function printError(f, isError, innerText)
{
    let field = document.querySelector(`form #${f}`)
    if (isError && f != 'error')
    {
       field.classList.remove(`is-valid`)
       field.classList.add(`is-invalid`)
    }
    else if (f != 'error')
    {
        field.classList.remove(`is-invalid`)
        field.classList.add(`is-valid`)
    }
    document.querySelector(`#${f}Feedback`).innerHTML = innerText
}

export function checkBlankField(event)
{
    let value = event.target.value;
    let field = event.target.getAttribute("id");
    document.querySelector("form #errorFeedback").classList.add("d-none")

    if (value === "")
    {
        event.target.classList.add("is-invalid")
        document.querySelector(`form #${field}`).classList.add(`is-invalid`)
        document.querySelector(`form #${field}Feedback`).innerHTML = "This fields must not be blank"
        return false;
    }
    else
    {
        document.querySelector(`form #${field}`).classList.remove(`is-invalid`)
        document.querySelector(`form #${field}`).classList.add(`is-valid`)
        return true;
    }
}
export function checkEmail(event) {
    let inputEmail = event.target.value
    let field = event.target.getAttribute("id");
    document.querySelector("form #errorFeedback").classList.add("d-none")

    if (inputEmail.match(EMAIL_REGEX) )
    {
        document.querySelector(`form #${field}`).classList.remove(`is-invalid`)
        document.querySelector(`form #${field}`).classList.add(`is-valid`)
        return true;
    }
    else
    {
        document.querySelector(`form #${field}`).classList.add(`is-invalid`)
        document.querySelector(`form #${field}Feedback`).innerHTML = "Wrong email address"
        return false;
    }
}