interface EditProps {
    incomingEdit: string
}

export function EditComponent({ incomingEdit }: EditProps) {
    return (
        <div>
            <div>{incomingEdit}</div>
        </div>
    )
}