<template>
    <div>
        <div>
            <p>Введите наимекнование</p>
            <input type="text" name="NAME" id="NAME_cl" v-model="names">
            <p>Введите ИНН</p>
            <input type="number" name="INN" id="INN_cl" v-model="inns" >
            <p>Введите ОГРН</p>
            <input type="text" name="OGRN" id="OGRN_cl" v-model="ogrns">
            <p>Введите Адрес</p>
            <input type="text" name="ADRESS" id="ADRESS_cl" v-model="adresss">
            <p>Введите Телефон</p>
            <input type="number" name="TELEPHONE" id="TELEPHONE_cl" v-model="phones">
            <p>Введите email</p>
            <input type="number" name="EMAIL" id="EMAIL_cl" v-model="emails">

            <button @click="addclients">Добавить клиента</button>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();


//^[\w\s\d\-А-яЁё]+$
const names = ref('')


//^(\d{10}|\d{12})$
const inns = ref()

//^(\d{13}|\d{15})$
const ogrns = ref()

//^[а-яА-ЯёЁa-zA-Z0-9\s\.,\-\/№]+$
const adresss = ref()

//^(\+7|8)?\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$
const phones = ref()

///^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const emails = ref()




const loading = ref(true);
const error = ref('');
const submitting = ref(false);
const name_cl = ref('')

// const { name, inn, ogrn, address, phone, email } = req.body;
async function addclients(){
    //Валидация наименования
    let regi = '^[\w\s\d\-А-яЁё]+$'
    let res = names.value.match(regi)


}


/*
1. Нужно взять id клинта от основной страницы(не правильно, я думал это редактрование),
2. потом сделать get запрос по пути 'Clients', получить данные, и 
3. дать возможность отредактировать клиента, 
4. далее сохранить в каком то обекте и 
5.отправить patch запрос. 
*/

</script>