
$(document).ready(()=>{
    $('.deleteUser').on('click',deleteUser);
});

function deleteUser(){
    var confirmation = confirm('Delete user?');

    if (confirmation){
        $.ajax({
            type:'DELETE',
            url:'/users/delete/' + $(this).data('id')
        }).done((response)=>{
            window.location.replace('/');
        });
        window.location.replace('/');
    }else{
        return false;
    }
}
$(".datepicker").attr("autocomplete", "off");